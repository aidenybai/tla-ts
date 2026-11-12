import {
  appendFileSync,
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  readSync,
  realpathSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, isAbsolute, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import type { CheckOptions, ModuleOperator, CheckStatus } from "../check";
import { parseConfig } from "../config";
import { checkDepthFirst } from "../dfid";
import {
  TlaConfigError,
  TlaError,
  TlaEvaluationError,
  TlaFeatureUnsupportedError,
  TlaMissingCheckpointError,
  TlaSyntaxError,
  getUnexpectedException,
  TlaSanyFatalError,
} from "../errors";
import { EXIT_STATUS } from "../exit-codes";
import { check } from "../parallel";
import { extractModule, parseModule } from "../parser";
import { simulate } from "../simulate";
import type { StateDump } from "../state-graph";
import {
  getSanyStandardModules,
  SANY_174_STANDARD_MODULES,
  SANY_STANDARD_MODULES,
} from "../sany/modules";
import { getSanyReport, type SanyModuleOrigin } from "../sany/report";
import { getTlcFingerprint } from "../tlc/fingerprint";
import type { TlcVersion } from "../tlc/version";
import {
  createMessagePrinter,
  formatTlcDate,
  formatNestedMessage,
  formatTlcDuration,
  MESSAGE_CODE,
  MESSAGE_LEVEL,
} from "../tlc/messages";
import { addRuntimeInvariants } from "./runtime-invariants";
import { parseTlcArguments, type TlcArguments } from "./tlc-arguments";
import {
  getClassPath,
  printCheckProgress,
  printCommandLineError,
  printDepthFirst,
  printResult,
  printSimulation,
  printStartupBanner,
  printWelcome,
  type Timing,
  type TlcPrinter,
} from "./tlc-output";
import { getTlcUsage } from "./tlc-usage";
import {
  createModuleLoader,
  findModuleFile,
  getInputPaths,
  getToolsJar,
  getStandardModulesUrl,
  getTopLevelExitCode,
  printError,
  printMissingFile,
  printMissingFile174,
  reportErrors,
  reportMissingModules174,
  toLibraryPath,
  type JavaProperties,
} from "./shared";
import { writeTypeScriptSpec } from "./typescript";

const EXIT_CODES: Record<CheckStatus, number> = {
  success: EXIT_STATUS.success,
  "assumption-violation": EXIT_STATUS.assumptionViolation,
  deadlock: EXIT_STATUS.deadlock,
  "invariant-violation": EXIT_STATUS.safetyViolation,
  "property-violation": EXIT_STATUS.safetyViolation,
  "liveness-violation": EXIT_STATUS.livenessViolation,
  "postcondition-violation": EXIT_STATUS.assumptionViolation,
  error: EXIT_STATUS.error,
};

const checkNotDirectory = (path: string) => {
  if (statSync(path, { throwIfNoEntry: false })?.isDirectory()) {
    throw new TlaEvaluationError(`${path} (Is a directory)`);
  }
};

const getDumpPath = (path: string, extension: string) =>
  path.endsWith(extension) ? path : `${path}${extension}`;

const getStateDump = (values: string[]): StateDump => {
  if (values.length === 1) return { path: getDumpPath(values[0], ".dump") };
  const format = values[0].toLowerCase();
  return {
    path: getDumpPath(values[1], ".dot"),
    dot: true,
    colorize: format.includes("colorize"),
    actionLabels: format.includes("actionlabels"),
    snapshot: format.includes("snapshot"),
    constrained: format.includes("constrained"),
    stuttering: format.includes("stuttering"),
    strict: format.includes("strict"),
  };
};

// Deviation from TLC: Java names the directory by a random unsigned long, and tla-ts by what the directory holds, so that each run of a spec prints the same files.
const getTemporaryName = (contents: string) => getTlcFingerprint([contents]).toString();

const createFileDescriber = (
  specPath: string,
  directories: string[],
  java: JavaProperties,
  metadir: string | undefined,
  version: TlcVersion,
) => {
  const temporary = java.temporaryDirectory ?? tmpdir();
  const temporaryDirectory = existsSync(temporary) ? realpathSync(temporary) : resolve(temporary);
  const libraryDirectory = join(temporaryDirectory, `tlc-${getTemporaryName(resolve(specPath))}`);
  const jar = getToolsJar(java);
  return (name: string, origin: SanyModuleOrigin) => {
    const fileName = `${name}.tla`;
    if (origin === "file") return realpathSync(findModuleFile(directories, name) ?? specPath);
    if (version === "1.7.4") return join(temporaryDirectory, fileName);
    if (origin === "root file") {
      const directory = metadir === undefined ? temporaryDirectory : resolve(metadir);
      const root = realpathSync(specPath);
      return `${join(directory, getTemporaryName(`${root} ${name}`), fileName)} (${root})`;
    }
    const copy = join(libraryDirectory, fileName);
    return jar === undefined ? copy : `${copy} (${getStandardModulesUrl(jar)}${fileName})`;
  };
};

const getEmbeddedConfig = (contents: string, name: string) => {
  const lines = contents.split(/\r?\n/);
  const start = lines.findIndex(
    (line) => line.match(/^-----*\s*CONFIG\s+(\S+?)\s*-----*$/)?.[1] === name,
  );
  if (start === -1) return "\n";
  const end = lines.findIndex((line, index) => index > start && line.startsWith("===="));
  return `${lines
    .slice(start + 1, end === -1 ? undefined : end)
    .join("\n")
    .trim()}\n`;
};

const getJavaPath = (path: string) => path.replace(/\/+/g, "/").replace(/(.)\/$/, "$1");

const getJavaParent = (path: string) => {
  const normalized = getJavaPath(path);
  const separator = normalized.lastIndexOf("/");
  return separator === -1 ? "." : normalized.slice(0, Math.max(separator, 1));
};

const resolveJavaPath = (directory: string, name: string) =>
  directory.endsWith("/") ? `${directory}${name}` : `${directory}/${name}`;

const getTraceSpecLocation = (
  args: TlcArguments,
  version: TlcVersion,
  mainFile: string,
  startTime: number,
) => {
  const isGenerated =
    version !== "1.7.4" &&
    (args.isTraceSpecForced ||
      (!args.isTraceSpecDisabled &&
        !args.isTool &&
        !args.isContinued &&
        !basename(mainFile).includes("_TTrace")));
  if (!isGenerated) return undefined;
  const output = args.traceSpecPath;
  const module = `${basename(mainFile)}_TTrace_${Math.floor(startTime / 1000)}`;
  const location =
    output === undefined
      ? { directory: getJavaParent(mainFile), module }
      : output.toLowerCase().endsWith(".tla")
        ? { directory: getJavaParent(output), module: basename(output).replace(/\.tla$/, "") }
        : { directory: getJavaPath(output), module };
  return {
    ...location,
    traceFile: args.isTraceBinaryDisabled
      ? undefined
      : resolveJavaPath(location.directory, `${location.module}.bin`),
  };
};

const JAVA_FILE_ERRORS: Record<string, string> = {
  ENOENT: "No such file or directory",
  ENOTDIR: "Not a directory",
  EISDIR: "Is a directory",
  EACCES: "Permission denied",
};

const writeJavaFile = (path: string, content: string | Uint8Array) => {
  try {
    writeFileSync(path, content);
  } catch (error) {
    const reason =
      error instanceof Error && "code" in error ? JAVA_FILE_ERRORS[String(error.code)] : undefined;
    if (reason === undefined) throw error;
    throw new TlaEvaluationError(`${path} (${reason})`);
  }
};

// Java's File#mkdirs reports a failure only through its result, which TLC ignores.
const makeJavaDirectory = (path: string) => {
  try {
    mkdirSync(path, { recursive: true });
  } catch {}
};

const createMetadir = (args: TlcArguments) => {
  const now = new Date();
  const pad = (value: number, length = 2) => String(value).padStart(length, "0");
  const name = `${pad(now.getFullYear() % 100)}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}.${pad(now.getMilliseconds(), 3)}`;
  const directory = join(args.metadir ?? "states", name);
  mkdirSync(directory, { recursive: true });
  return directory;
};

const checkSpec = async (
  specPath: string,
  args: TlcArguments,
  dump: StateDump | undefined,
  java: JavaProperties,
  printer: TlcPrinter,
) => {
  const livenessCheck = args.livenessCheck;
  const version = printer.version;
  printWelcome(printer);
  const recoverDirectory = args.recoverDirectory;
  if (recoverDirectory !== undefined) {
    throw existsSync(join(recoverDirectory, "vars.chkpt"))
      ? new TlaFeatureUnsupportedError(
          `tla-ts can't recover a model check from the checkpoint in ${recoverDirectory}.`,
        )
      : new TlaMissingCheckpointError(recoverDirectory);
  }
  printStartupBanner(printer, args);
  const configPath = args.configPath ?? specPath.replace(/\.tla$/, ".cfg");
  if (!existsSync(configPath)) {
    printer.print(
      MESSAGE_CODE.configFileError,
      MESSAGE_LEVEL.error,
      `TLC encountered the following error when trying to read the configuration file ${configPath}:\nFile not found.`,
    );
    return EXIT_STATUS.configParseError;
  }
  const fileName = basename(specPath, ".tla");
  const timing: Timing = { startTime: Date.now(), livenessStartTime: undefined, isParsed: false };
  const printFinished = () => {
    const runtime = Date.now() - timing.startTime;
    printer.print(
      MESSAGE_CODE.finished,
      MESSAGE_LEVEL.none,
      `Finished in ${printer.isTool ? `${runtime}ms` : formatTlcDuration(runtime)} at (${formatTlcDate(new Date())})`,
    );
  };
  const printParsingFailed = () =>
    printer.print(
      MESSAGE_CODE.parsingFailed,
      MESSAGE_LEVEL.error,
      "Parsing or semantic analysis failed.",
    );
  const printFailure = (error: TlaError) => {
    if (error instanceof TlaSyntaxError) {
      printParsingFailed();
    } else {
      printError(error, printer);
    }
    printFinished();
    return getTopLevelExitCode(error);
  };
  const config = (() => {
    try {
      const contents = readFileSync(configPath, "utf8");
      return parseConfig(
        configPath.endsWith(".tla")
          ? getEmbeddedConfig(contents, configPath.replaceAll(".tla", ""))
          : contents,
        version,
      );
    } catch (error) {
      if (!(error instanceof TlaConfigError)) throw error;
      return error;
    }
  })();
  if (config instanceof TlaConfigError && version === "1.7.4") {
    printer.print(
      MESSAGE_CODE.general,
      MESSAGE_LEVEL.error,
      `${getUnexpectedException("tlc2.tool.ConfigFileException")}${formatNestedMessage(config.message, printer.isTool)}`,
    );
    printFinished();
    return EXIT_STATUS.error;
  }
  if (config instanceof TlaConfigError) return printFailure(config);
  if (!args.isDeadlockChecked) config.checkDeadlock = false;
  const directory = dirname(specPath);
  const directories = [directory, ...java.libraries];
  const loadModule = createModuleLoader(directories);
  const traceSpec = getTraceSpecLocation(
    args,
    version,
    specPath.replace(/\.tla$/, ""),
    timing.startTime,
  );
  const getOperatorModules = (kind: ModuleOperator["kind"]) =>
    args.moduleOperators
      .filter((operator) => operator.kind === kind)
      .map((operator) => operator.module);
  if (printer.isTool) {
    printer.print(MESSAGE_CODE.startingSany, MESSAGE_LEVEL.none, "Starting SANY...");
  }
  const isAbsoluteSpec = isAbsolute(specPath);
  const specName = isAbsoluteSpec ? fileName : specPath.replace(/\.tla$/, "");
  const jar = getToolsJar(java);
  const reportMissingFile =
    version === "1.7.4" ? createMissingFilePrinter174(specPath, java, jar) : undefined;
  if (reportMissingFile) {
    if (!existsSync(specPath) && !SANY_174_STANDARD_MODULES.has(fileName)) {
      reportMissingFile(`${fileName}.tla`);
    }
  } else if (!existsSync(specPath) && !SANY_STANDARD_MODULES.has(fileName)) {
    printMissingFile(
      isAbsoluteSpec ? directory : process.cwd(),
      isAbsoluteSpec ? `${fileName}.tla` : `./${specName}.tla`,
      [...(isAbsoluteSpec || directory === "." ? [] : [directory]), ...java.libraries],
    );
  }
  const sany = getSanyReport(
    specPath,
    reportMissingFile ? reportMissingModules174(loadModule, reportMissingFile) : loadModule,
    {
      fileName: specName,
      describeFile: createFileDescriber(specPath, directories, java, args.metadir, version),
      version,
      rootExtendees: [
        ...getOperatorModules("postcondition"),
        ...(traceSpec?.traceFile === undefined ? [] : ["_TLCTrace"]),
        ...args.invariants.flatMap((invariant) => invariant.modules),
        ...getOperatorModules("constraint"),
        ...getOperatorModules("view").slice(0, 1),
      ],
      suppressedCodes: args.suppressedCodes,
      errorCodes: args.errorCodes,
      onPrint: (text) => process.stdout.write(text),
      onPrintError: (text) => process.stderr.write(text),
    },
  );
  const specification = sany.specification;
  if (sany.isFailed || specification === undefined) {
    printCheckProgress(printer, { kind: "parsed" }, timing, directory);
    printParsingFailed();
    printFinished();
    return EXIT_STATUS.specParseError;
  }
  try {
    const source = readFileSync(specPath, "utf8");
    const moduleName = parseModule(source).name;
    if (moduleName !== fileName) {
      throw new TlaSanyFatalError(
        `File name '${fileName}' does not match the name '${moduleName}' of the top level module it contains.`,
        undefined,
      );
    }
    const userFile = args.userFile;
    const standardModules = getSanyStandardModules(version);
    const invariants = addRuntimeInvariants(
      source,
      specification.root,
      args.invariants,
      (name) => loadModule(name) ?? standardModules.get(name) ?? extractModule(source, name),
      version,
    );
    config.invariants.push(...invariants.names);
    const options: CheckOptions = {
      workers: args.workers,
      livenessCheck:
        livenessCheck === "off"
          ? "off"
          : ["final", "seqfinal"].includes(livenessCheck)
            ? "final"
            : "default",
      seed: args.seed,
      fingerprintPolynomial: args.fingerprintIndex,
      maxSetSize: args.maxSetSize,
      isLazyValueExpanded: args.isLazyValueExpanded,
      isViewPrinted: args.isViewPrinted,
      dump,
      isTool: printer.isTool,
      isContinued: args.isContinued,
      moduleOperators: args.moduleOperators,
      traceSpec,
      coverage: args.coverage,
      isSanyReported: true,
      isWarningEnabled: args.isWarningEnabled,
      version,
      onProgress: (progress) => printCheckProgress(printer, progress, timing, directory),
      onPrint: userFile === undefined ? undefined : (text) => appendFileSync(userFile, `${text}\n`),
      source: invariants.source,
      config,
      onPause: () => readSync(0, Buffer.alloc(1)),
      loadModule,
      loadClass: (name) => {
        const classPath = getClassPath(directory, name);
        return existsSync(classPath) ? readFileSync(classPath) : undefined;
      },
      readFile: (path) => {
        checkNotDirectory(path);
        return existsSync(path) ? readFileSync(path, "utf8") : undefined;
      },
      writeFile: writeJavaFile,
      makeDirectory: makeJavaDirectory,
    };
    if (args.mode !== "model-check") {
      const status = simulate({
        ...options,
        traceDepth: args.traceDepth,
        traceCount: args.traceCount,
        aril: args.aril,
        isGenerating: args.mode === "generate",
        scheduler: args.scheduler,
        onSimulation: (output) => printSimulation(printer, output),
      });
      printFinished();
      return status;
    }
    if (args.dfidDepth !== undefined) {
      const status = checkDepthFirst({
        ...options,
        maxDepth: args.dfidDepth,
        onOutput: (output) => printDepthFirst(printer, output),
      });
      printFinished();
      return status;
    }
    const result = await check(options);
    printResult(result, printer, timing);
    printFinished();
    if (traceSpec && result.traceSpec !== undefined) {
      const path = resolveJavaPath(traceSpec.directory, `${traceSpec.module}.tla`);
      makeJavaDirectory(traceSpec.directory);
      const failure = (() => {
        try {
          writeJavaFile(path, result.traceSpec);
          return undefined;
        } catch (error) {
          if (!(error instanceof TlaEvaluationError)) throw error;
          return error;
        }
      })();
      printer.print(
        failure ? MESSAGE_CODE.traceSpecFailed : MESSAGE_CODE.traceSpecWritten,
        MESSAGE_LEVEL.none,
        failure
          ? `Failed to generate trace exploration spec; error message: ${failure.message}`
          : `Trace exploration spec path: ${path}`,
      );
    }
    return result.failure?.exitCode ?? EXIT_CODES[result.status];
  } catch (error) {
    if (!(error instanceof TlaError)) throw error;
    if (error instanceof TlaSyntaxError) console.log(formatSanyErrors(error, fileName));
    if (!timing.isParsed) printCheckProgress(printer, { kind: "parsed" }, timing, directory);
    return printFailure(error);
  }
};

const formatSanyErrors = (error: TlaSyntaxError, specName: string) => {
  const isFatal = error instanceof TlaSanyFatalError;
  if (!isFatal && !error.failure)
    return `Semantic errors:\n\n*** Errors: 1\n\n${error.message}\n\n`;
  const report = !isFatal
    ? `In module ${specName}\n\nCould not parse module ${specName} from file ${specName}.tla`
    : error.location === undefined
      ? `Unknown location\n\n${error.message}`
      : `In module ${error.location}\n\n${error.message}`;
  const parseError = error.failure ? `***Parse Error***\n${error.message}\n\n` : "";
  return `${parseError}\nFatal errors while parsing TLA+ spec in file ${specName}\n\n${report}\n*** Errors: 1\n\n${report}\n\n\n`;
};

export const checkSpecs = async (args: string[], java: JavaProperties) => {
  const version = java.tlcVersion ?? "master";
  const parsed = parseTlcArguments(args);
  if (parsed === "usage") {
    console.log(getTlcUsage());
    return 1;
  }
  if ("error" in parsed) {
    if (parsed.isUncaught) {
      console.error(`Exception in thread "main" ${parsed.error}`);
      return 1;
    }
    return printCommandLineError(parsed.isTool, version, parsed.error);
  }
  const dump =
    parsed.dump &&
    getStateDump(
      parsed.dump.map((value) =>
        value.includes("${metadir}") ? value.replace("${metadir}", createMetadir(parsed)) : value,
      ),
    );
  const dumpPath = dump?.path;
  if (dumpPath !== undefined) {
    try {
      closeSync(openSync(dumpPath, "w"));
    } catch {
      console.log(`Error: Unable to write to file ${dumpPath}`);
      return printCommandLineError(
        parsed.isTool,
        version,
        `Error: Given file name ${dumpPath} for dumping states invalid.`,
      );
    }
  }
  const isConfigured = parsed.configPath !== undefined;
  if (isConfigured && parsed.specs.length > 1) {
    return printCommandLineError(
      parsed.isTool,
      version,
      `Error: more than one input files: ${parsed.specs[0].replace(/\.tla$/, "")} and ${parsed.specs[1]}`,
    );
  }
  const inputs = getInputPaths(parsed.specs);
  const specPaths = inputs
    .map((input) => ({
      ...input,
      path:
        input.isGlobbed || /\.(tla|cfg|ts)$/.test(input.path)
          ? input.path.replace(/\.cfg$/, ".tla")
          : `${input.path}.tla`,
    }))
    .filter(
      (input) =>
        input.path.endsWith(".ts") ||
        (input.path.endsWith(".tla") &&
          (!input.isGlobbed || isConfigured || existsSync(input.path.replace(/\.tla$/, ".cfg")))),
    )
    .map((input) => input.path);
  if (specPaths.length === 0) {
    return printCommandLineError(parsed.isTool, version, "Error: Missing input TLA+ module.");
  }
  if (isConfigured && specPaths.length > 1) {
    console.error("Error: -config applies to one specification, but several were given.");
    return 1;
  }
  const findSpec = (path: string) =>
    existsSync(path) || isAbsolute(path)
      ? path
      : (java.libraries.map((directory) => join(directory, path)).find(existsSync) ?? path);
  const paths = [...new Set(specPaths.map(findSpec))];
  const exitCodes: number[] = [];
  for (const [index, path] of paths.entries()) {
    if (index > 0) console.log("");
    const printer = {
      ...createMessagePrinter(
        parsed.isTool,
        parsed.isWarningEnabled,
        version,
        parsed.suppressedCodes,
        parsed.errorCodes,
      ),
      isDiffTrace: parsed.isDiffTrace,
    };
    exitCodes.push(
      await reportErrors(async () => {
        const specPath = path.endsWith(".ts") ? await writeTypeScriptSpec(path) : path;
        // Deviation from TLC: TLC checks one spec, so tla-ts names each of several it checks.
        if (paths.length > 1) {
          console.log(`Checking ${basename(specPath)} with ${basename(specPath, ".tla")}.cfg`);
        }
        return checkSpec(specPath, parsed, dump, java, printer);
      }, printer),
    );
  }
  return exitCodes.find((exitCode) => exitCode !== EXIT_STATUS.success) ?? EXIT_STATUS.success;
};

const createMissingFilePrinter174 = (
  specPath: string,
  java: JavaProperties,
  jar: string | undefined,
) => {
  const specDirectory = specPath.slice(0, specPath.lastIndexOf("/") + 1);
  const isRelativeToDirectory = !isAbsolute(specPath) && specDirectory !== "";
  const libraries = (isRelativeToDirectory ? [specDirectory] : java.libraries).map(toLibraryPath);
  const lastDirectory =
    libraries.length > 0
      ? libraries[libraries.length - 1]
      : isAbsolute(specPath)
        ? specDirectory
        : "";
  return (fileName: string) => printMissingFile174(`${lastDirectory}${fileName}`, libraries, jar);
};
