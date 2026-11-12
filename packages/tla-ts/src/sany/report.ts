import { fileSystem } from "../file-system";
import { basename } from "node:path";
import type { Module } from "../ast";
import { TlaSyntaxError, PcalRuntimeError, TlaSanyFatalError } from "../errors";
import { extractModule, parseSanyModule } from "../parser";
import { createPcalParams } from "../pcal/ast";
import { createPcalSession } from "../pcal/parse";
import { validatePcalModule } from "../pcal/validate";
import { generateSanySpecification, type SanySpecification } from "./generator";
import { checkModuleLevels } from "./levels";
import { getSany174LexicalError } from "./lexer";
import { lintSanyModule } from "./linter";
import { getSanyStandardModules } from "./modules";
import { formatSanyLocation, type SanyMessage } from "./nodes";
import { getUnboxedSource } from "./source";
import type { TlcVersion } from "../tlc/version";

interface SanyReport {
  text: string;
  isFailed: boolean;
  specification?: SanySpecification;
}

export type SanyModuleOrigin = "file" | "root file" | "standard";

export interface SanyReportOptions {
  fileName?: string;
  describeFile?: (moduleName: string, origin: SanyModuleOrigin) => string;
  isXmlExport?: boolean;
  version?: TlcVersion;
  rootExtendees?: string[];
  suppressedCodes?: number[];
  errorCodes?: number[];
  onPrint?: (text: string) => void;
  onPrintError?: (text: string) => void;
}

interface LoadedModule {
  text: string;
  module: Module;
}

interface Validation {
  text: string;
  isError: boolean;
}

const formatMessage = (message: SanyMessage) =>
  `${formatSanyLocation(message.location)}\n\n${message.text}`;

const formatErrors = (messages: SanyMessage[]) => {
  const errors = messages.filter((message) => !message.isWarning);
  const warnings = messages.filter((message) => message.isWarning);
  return [
    errors.length > 0 ? `*** Errors: ${errors.length}\n\n` : "",
    ...errors.map((error) => `${formatMessage(error)}\n\n\n`),
    warnings.length > 0 ? `*** Warnings: ${warnings.length}\n\n` : "",
    ...warnings.map((warning) => `${formatMessage(warning)}\n\n\n`),
  ].join("");
};

const RECORD_FIELD_CLASH = 4802;

const UNLINTED_MODULES = new Set([
  "FiniteSets",
  "Sequences",
  "Bags",
  "Naturals",
  "Integers",
  "Reals",
  "RealTime",
  "Randomization",
  "TLC",
]);

const getExtendees = (module: Module) => {
  const innerNames = new Set<string>();
  const extendees: string[] = [];
  const visit = (current: Module) => {
    innerNames.add(current.name);
    extendees.push(...current.extends);
    current.modules.forEach(visit);
  };
  visit(module);
  return extendees.filter((extendee) => !innerNames.has(extendee));
};

// HACK: the report parses a module to find the lines SANY's validation of its PlusCal reads, and
// a module that doesn't parse is one SANY stops at before validating it.
const parseValidatedModule = (text: string) => {
  try {
    return parseSanyModule(getUnboxedSource(text));
  } catch (error) {
    if (error instanceof TlaSyntaxError) return undefined;
    throw error;
  }
};

export const getSanyModuleName = (text: string, version?: TlcVersion) =>
  version === "1.7.4" && getSany174LexicalError(text) !== undefined
    ? undefined
    : parseValidatedModule(text)?.name;

export const getSanyReport = (
  rootPath: string,
  loadModule: (name: string) => string | undefined,
  options: SanyReportOptions = {},
): SanyReport => {
  const rootName = basename(rootPath, ".tla");
  const standardModules = getSanyStandardModules(options.version);
  const name = options.fileName ?? rootName;
  const source = fileSystem.existsSync(rootPath)
    ? fileSystem.readFileSync(rootPath, "utf8")
    : standardModules.get(rootName);
  const lines: string[] = [];
  const write = (text: string) => {
    lines.push(text);
    options.onPrint?.(text);
  };
  const log = (text: string) => write(`${text}\n`);
  const isTlc174 = options.version === "1.7.4";
  const isToolOutputDiscarded = isTlc174 && options.isXmlExport;
  const warn = (text: string) => {
    if (!options.isXmlExport) log(text);
  };
  const describeFile = options.describeFile;
  const origins = new Map<string, SanyModuleOrigin>([
    [rootName, fileSystem.existsSync(rootPath) ? "file" : "standard"],
  ]);
  let isFailed = false;
  const parseMessages: SanyMessage[] = [];
  let isParseReported = false;
  let isParseAborted = false;
  const session = createPcalSession(createPcalParams(), log);
  const loadedModules = new Map<string, LoadedModule>();
  const validations: Validation[] = [];
  const printValidations = () =>
    validations
      .splice(0)
      .forEach((validation) =>
        validation.isError ? options.onPrintError?.(`${validation.text}\n`) : log(validation.text),
      );
  const validate = (moduleName: string) => {
    const loaded = loadedModules.get(moduleName);
    const range = loaded?.module.location.range;
    if (loaded === undefined || range === undefined) return;
    const fileLines = loaded.text.split(/\r\n|\r|\n/);
    const results = validatePcalModule(
      session,
      fileLines.slice(range.start.line - 1, range.end.line),
      options.version,
    );
    const isTlaChanged = results.has("TLA_DIVERGENCE_EXISTS");
    const isPcalChanged = results.has("PCAL_DIVERGENCE_EXISTS");
    const oneChange =
      isTlaChanged === isPcalChanged
        ? undefined
        : `The ${isTlaChanged ? "TLA+ translation" : "PlusCal algorithm"} in module ${moduleName} has changed since its last translation.`;
    if (isTlc174) {
      const warning =
        isTlaChanged && isPcalChanged
          ? `The PlusCal algorithm and its TLA+ translation in module ${moduleName} filename since the last translation.`
          : oneChange;
      if (warning !== undefined)
        validations.push({ text: `!! WARNING: ${warning}`, isError: false });
      else if (results.has("ERROR_ENCOUNTERED")) {
        validations.push({
          text: `A unexpected problem was encountered attempting to validate the specification for ${moduleName}`,
          isError: true,
        });
      }
      return;
    }
    const text =
      isTlaChanged && isPcalChanged
        ? `Both the PlusCal algorithm and its TLA+ translation in module ${moduleName} have changed since the last translation.`
        : (oneChange ??
          (results.has("ERROR_ENCOUNTERED")
            ? `An unexpected problem was encountered attempting to validate the specification for ${moduleName}`
            : undefined));
    if (text === undefined) return;
    const isWarning = !results.has("ERROR_ENCOUNTERED") || isTlaChanged || isPcalChanged;
    if (parseMessages.some((message) => message.text === text)) return;
    parseMessages.push({ location: moduleName, text, isWarning });
  };
  const loadValidatedModule = (moduleName: string, text: string) => {
    if (options.isXmlExport || loadedModules.has(moduleName)) return;
    const module = parseValidatedModule(text);
    if (module === undefined || module.name !== moduleName) return;
    const extenders = [...loadedModules.values()].filter((loaded) =>
      getExtendees(loaded.module).includes(moduleName),
    );
    loadedModules.set(moduleName, { text, module });
    extenders.forEach(() => validate(moduleName));
    getExtendees(module)
      .filter((extendee) => extendee !== moduleName && loadedModules.has(extendee))
      .forEach(validate);
  };
  const reportParseMessages = () => {
    printValidations();
    if (isParseReported) return;
    isParseReported = true;
    const warnings = parseMessages.filter((message) => message.isWarning);
    if (warnings.length > 0) {
      warn(`Warnings (${warnings.length}) during syntax parsing of ${name}:\n\n`);
      warnings.forEach((warning) => warn(`${formatMessage(warning)}\n\n\n`));
    }
    if (warnings.length === parseMessages.length) return;
    log(formatErrors(parseMessages));
    isFailed = true;
    isParseAborted = true;
  };
  const loadSource = (moduleName: string) => {
    const standard = standardModules.get(moduleName);
    const file = loadModule(moduleName);
    const extracted =
      file === undefined && standard === undefined && source !== undefined && !isTlc174
        ? extractModule(source, moduleName)
        : undefined;
    const text = file ?? extracted;
    origins.set(
      moduleName,
      file !== undefined ? "file" : extracted !== undefined ? "root file" : "standard",
    );
    if (text !== undefined) loadValidatedModule(moduleName, text);
    return text ?? standard;
  };
  const generate = () => {
    // HACK: SANY reports a fatal parsing error by the exception it throws, so the report catches the
    // TlaSyntaxError the generator throws for one.
    try {
      if (source === undefined) {
        throw new TlaSanyFatalError(`Cannot find source file for module ${name}`, undefined);
      }
      loadValidatedModule(rootName, source);
      return generateSanySpecification(source, loadSource, {
        rootFileName: rootName,
        rootFilePath: options.isXmlExport ? `${name.replace(/\.tla$/, "")}.tla` : undefined,
        version: options.version,
        rootExtendees: options.rootExtendees,
        onParse: (moduleName) => {
          if (describeFile) {
            log(`Parsing file ${describeFile(moduleName, origins.get(moduleName) ?? "file")}`);
          }
          if (moduleName === rootName) validate(rootName);
          printValidations();
        },
        onAnalyze: (moduleName) => {
          reportParseMessages();
          if ((describeFile || isToolOutputDiscarded) && !isParseAborted) {
            log(`Semantic processing of module ${moduleName}`);
          }
        },
        onModule: (module, messages) => {
          if (isParseAborted) return;
          if (messages.every((message) => message.isWarning))
            checkModuleLevels(module, { messages, isTlc174 });
          if (messages.length === 0) return;
          if (messages.some((message) => !message.isWarning)) isFailed = true;
          if (isTlc174) return log(`Semantic errors:\n\n${formatErrors(messages)}`);
          const warnings = messages.filter((message) => message.isWarning);
          if (warnings.length > 0) {
            warn(`*** Warnings: ${warnings.length}\n`);
            warnings.forEach((warning) => warn(`${formatMessage(warning)}\n\n\n`));
          }
          const errors = messages.filter((message) => !message.isWarning);
          if (errors.length === 0) return;
          log(`Semantic errors:\n\n*** Errors: ${errors.length}\n`);
          errors.forEach((error) => log(`${formatMessage(error)}\n\n`));
        },
      });
    } catch (error) {
      isFailed = true;
      if (error instanceof PcalRuntimeError) {
        log(`\nFatal errors while parsing TLA+ spec in file ${name}\n`);
        log(error.message);
        log(formatErrors(parseMessages));
        return;
      }
      if (!(error instanceof TlaSanyFatalError)) throw error;
      const fatal = { location: error.location, text: error.message, isWarning: false };
      const isImageless = isTlc174 && error.parseError?.includes(' and token "" ');
      if (error.parseError !== undefined && !isImageless && !isToolOutputDiscarded) {
        log(error.parseError);
      }
      log(`\nFatal errors while parsing TLA+ spec in file ${name}\n`);
      if (isImageless) {
        log(
          'java.lang.NullPointerException: Cannot invoke "String.length()" because "str" is null',
        );
        return;
      }
      if (isTlc174) {
        log("tla2sany.semantic.AbortException");
        write(`*** Abort messages: 1\n\n${formatMessage(fatal)}\n\n\n`);
        return;
      }
      log(formatMessage(fatal));
      log(formatErrors(isParseReported ? [fatal] : [...parseMessages, fatal]));
    }
  };
  const specification = generate();
  if (specification !== undefined) reportParseMessages();
  if (specification !== undefined && !isFailed && !options.isXmlExport && !isTlc174) {
    const linted = specification.modules.filter((module) => !UNLINTED_MODULES.has(module.name));
    if (describeFile) linted.forEach((module) => log(`Linting of module ${module.name}`));
    const warnings = options.suppressedCodes?.includes(RECORD_FIELD_CLASH)
      ? []
      : linted.flatMap(lintSanyModule);
    const prefix = options.errorCodes?.includes(RECORD_FIELD_CLASH)
      ? "Warning treated as error: "
      : "";
    warnings.forEach((warning) => log(`${prefix}${formatMessage(warning)}\n\n\n`));
    if (prefix && warnings.length > 0) isFailed = true;
  }
  return {
    text: lines.join(""),
    isFailed,
    specification: isParseAborted ? undefined : specification,
  };
};
