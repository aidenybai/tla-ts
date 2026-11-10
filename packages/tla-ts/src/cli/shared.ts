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

export const findModuleFile = (directories: string[], name: string) =>
  directories.map((directory) => join(directory, `${name}.tla`)).find(existsSync);

export const createModuleLoader = (directories: string[]) => (name: string) => {
  const path = findModuleFile(directories, name);
  return path === undefined ? undefined : readFileSync(path, "utf8");
};

export const printMissingFile = (userDirectory: string, fileName: string, directories: string[]) =>
  console.error(
    `File does not exist: ${userDirectory}/${fileName} while looking in these directories: ${userDirectory}, ${directories.join(", ")}, classpath:/tla2sany/StandardModules, classpath:/`,
  );

export const getStandardModulesUrl = (jar: string) =>
  `jar:file:${pathToFileURL(resolve(jar)).pathname}!/tla2sany/StandardModules/`;

export const printError = (error: TlaError, printer: MessagePrinter) => {
  if (error instanceof TlaConfigError || error instanceof TlaEvaluationError) {
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

export const printMissingFile174 = (path: string, libraries: string[], jar: string | undefined) =>
  console.error(
    `File does not exist: ${isAbsolute(path) ? path : `${process.cwd()}/${path}`} while looking in these directories: ${[...libraries, ...(jar === undefined ? [] : [getStandardModulesUrl(jar)])].join(", ")}`,
  );

export const toLibraryPath = (directory: string) =>
  directory.endsWith("/") ? directory : `${directory}/`;

export const reportMissingModules174 =
  (loadModule: (name: string) => string | undefined, onMissing: (fileName: string) => void) =>
  (name: string) => {
    const text = loadModule(name);
    if (text === undefined && !SANY_174_STANDARD_MODULES.has(name)) onMissing(`${name}.tla`);
    return text;
  };

export interface JavaProperties {
  libraries: string[];
  classPath?: string;
  temporaryDirectory?: string;
  tlcVersion?: TlcVersion;
}

export const getToolsJar = (java: JavaProperties) =>
  java.classPath?.split(delimiter).find((entry) => entry.endsWith(".jar"));
