import { existsSync, globSync, readFileSync } from "node:fs";
import { delimiter, isAbsolute, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { getErrorExitCode, TlaConfigError, TlaError, TlaEvaluationError } from "../errors";
import { SANY_174_STANDARD_MODULES } from "../sany/modules";
import type { TlcVersion } from "../tlc/version";
import {
  createMessagePrinter,
  formatInnerMessage,
  getCodedMessage,
  MESSAGE_CODE,
  MESSAGE_LEVEL,
  type MessagePrinter,
} from "../tlc/messages";

const GLOB_CHARACTERS = /[*?[{]/;

interface InputPath {
  path: string;
  isGlobbed: boolean;
}

export const getInputPaths = (paths: string[]): InputPath[] =>
  paths.flatMap((arg): InputPath[] =>
    GLOB_CHARACTERS.test(arg)
      ? globSync(arg)
          .sort()
          .map((path) => ({ path, isGlobbed: true }))
      : [{ path: arg, isGlobbed: false }],
  );

// Like TLC, tla-ts finds a module in the directory of the spec, then in each library directory.
export const findModuleFile = (directories: string[], name: string) =>
  directories.map((directory) => join(directory, `${name}.tla`)).find(existsSync);

export const createModuleLoader = (directories: string[]) => (name: string) => {
  const path = findModuleFile(directories, name);
  return path === undefined ? undefined : readFileSync(path, "utf8");
};

// SimpleFilenameToStream: SANY names the file of a module it can't find, and where it looked.
export const printMissingFile = (userDirectory: string, fileName: string, directories: string[]) =>
  console.error(
    `File does not exist: ${userDirectory}/${fileName} while looking in these directories: ${userDirectory}, ${directories.join(", ")}, classpath:/tla2sany/StandardModules, classpath:/`,
  );

// The URL of the directory of SANY's standard modules in a tla2tools.jar.
export const getStandardModulesUrl = (jar: string) =>
  `jar:file:${pathToFileURL(resolve(jar)).pathname}!/tla2sany/StandardModules/`;

// TLC prints the errors it raises itself. tla-ts names the others, such as a module SANY rejects.
export const printError = (error: TlaError, printer: MessagePrinter) => {
  if (error instanceof TlaConfigError || error instanceof TlaEvaluationError) {
    // TLC prints an error it raises with a message code, such as a configuration error, with
    // that code.
    const coded = getCodedMessage(error.message);
    const code = coded && !coded.isEvalException ? coded.code : MESSAGE_CODE.general;
    return printer.print(
      code,
      MESSAGE_LEVEL.error,
      formatInnerMessage(code, error.message, printer.isTool),
    );
  }
  console.error(`${error.name}: ${error.message}`);
};

// Prints a TlaError and returns its exit code.
export const reportErrors = async (
  run: () => number | Promise<number>,
  printer = createMessagePrinter(false),
) => {
  try {
    return await run();
  } catch (error) {
    if (!(error instanceof TlaError)) throw error;
    printError(error, printer);
    return getErrorExitCode(error);
  }
};

// TLC 1.7.4's FileUtil.createNamedInputStream names the last file that SimpleFilenameToStream
// looked for a module in, and the directories it looks in, the standard modules in the jar last,
// which tla-ts leaves out without a jar.
export const printMissingFile174 = (path: string, libraries: string[], jar: string | undefined) =>
  console.error(
    `File does not exist: ${isAbsolute(path) ? path : `${process.cwd()}/${path}`} while looking in these directories: ${[...libraries, ...(jar === undefined ? [] : [getStandardModulesUrl(jar)])].join(", ")}`,
  );

// SimpleFilenameToStream ends a library directory with a separator.
export const toLibraryPath = (directory: string) =>
  directory.endsWith("/") ? directory : `${directory}/`;

// TLC 1.7.4's SANY reports each module it can't find as it looks for it.
export const reportMissingModules174 =
  (loadModule: (name: string) => string | undefined, onMissing: (fileName: string) => void) =>
  (name: string) => {
    const text = loadModule(name);
    if (text === undefined && !SANY_174_STANDARD_MODULES.has(name)) onMissing(`${name}.tla`);
    return text;
  };

// What the java command sets for TLC: the TLA-Library directories it searches for modules, the
// class path it finds its standard modules on, and java.io.tmpdir, where it copies them.
export interface JavaProperties {
  libraries: string[];
  classPath?: string;
  temporaryDirectory?: string;
  tlcVersion?: TlcVersion;
}

// The tla2tools.jar on the class path.
export const getJar = (java: JavaProperties) =>
  java.classPath?.split(delimiter).find((entry) => entry.endsWith(".jar"));
