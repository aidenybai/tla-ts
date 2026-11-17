import { existsSync, readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { getErrorExitCode, TlaJavaException, TlaUnsupportedError } from "../errors";
import { EXIT_STATUS } from "../exit-codes";
import type { SanySpecification } from "../sany/generator";
import { SANY_174_STANDARD_MODULES, SANY_STANDARD_MODULES } from "../sany/modules";
import { getSanyModuleName, getSanyReport } from "../sany/report";
import { exportSanyXml, XML_EXPORT_EXIT_CODE, type XmlExportOptions } from "../sany/xml";
import {
  createModuleLoader,
  printMissingFile,
  printMissingFile174,
  reportMissingModules174,
  toLibraryPath,
} from "./shared";
import { getBold } from "./tlc-usage";

const XML_EXPORT_USAGE = (() => {
  const options = [
    ["-I", "Include; use given directory path to resolve module dependencies."],
    ["-help", "Print this usage information."],
    ["-o", "Offline mode; skip XML schema validation step."],
    [
      "-r",
      "Restrict mode; include only declarations and definitions of the specified module, excluding extended or instantiated modules.",
    ],
    ["-t", "Terse; format XML output without tabs or newlines."],
    [
      "-u",
      "Uncomment; process boxed comments and single-line comments (\\*) in pre-comments to extract their content.",
    ],
  ];
  const tips = [
    "Only one root TLA+ file can be parsed per run.",
    "Multiple directory search paths can be given by providing multiple -I arguments.",
    "XML schema validation does not require network access.",
  ];
  return [
    "",
    getBold("NAME"),
    "",
    "\ttla2sany.xml.XMLExporter - Emit SANY's parse tree as XML - Version 2.2 created 08 July 2020",
    "",
    "",
    getBold("SYNOPSIS"),
    "",
    `\t${getBold("tla2sany.xml.XMLExporter")} [${getBold("-Iortu")}] [${getBold("-help")}] FILE`,
    "",
    getBold("DESCRIPTION"),
    "",
    "\tGiven a TLA+ file, parse that file with SANY then translate the module's semantic parse tree to XML, including all the modules depended on. The XML is printed to stdout and its output format is given by an XML Schema file (.xsd) found at https://proofs.tlapl.us/doc/web/sany.xsd.",
    "",
    getBold("OPTIONS"),
    "",
    ...options.map(([flag, description]) => `\t${getBold(flag)}\n\t\t${description}`),
    "",
    getBold("TIPS"),
    "",
    ...tips.flatMap((tip) => [`\t${tip}`, ""]),
    "",
  ].join("\n");
})();

const printXmlExportUsageError = (message: string) => {
  process.stderr.write(`ERROR: ${message}\n${XML_EXPORT_USAGE}`);
  return XML_EXPORT_EXIT_CODE.argsParsingFailure;
};

const writeXml = (specification: SanySpecification, options: XmlExportOptions) => {
  try {
    process.stdout.write(exportSanyXml(specification, options));
    return EXIT_STATUS.success;
  } catch (error) {
    if (!(error instanceof TlaUnsupportedError)) throw error;
    const exitCode = getErrorExitCode(error);
    const unwound = error instanceof TlaJavaException ? error.unwound : "";
    console.error(
      exitCode === XML_EXPORT_EXIT_CODE.uncaughtException
        ? `${unwound}Exception in thread "main" ${error.message}`
        : `ERROR: ${error.message}`,
    );
    return exitCode;
  }
};

const ARGUMENT_ERRORS = {
  "no-file": { message: "at least one .tla file must be given", line174: 59 },
  "missing-include": {
    message: "the -I flag must be followed by a directory and at least one .tla file",
    line174: 71,
  },
  "several-files": { message: "Only one TLA file to check allowed!", line174: 83 },
};

interface XmlExportArgs {
  flags: Set<string>;
  includes: string[];
  error: keyof typeof ARGUMENT_ERRORS | undefined;
}

const parseXmlExportArgs = (args: string[], flagNames: Set<string>): XmlExportArgs => {
  const parsed: XmlExportArgs = { flags: new Set(), includes: [], error: undefined };
  if (args.length === 0) return { ...parsed, error: "no-file" };
  let lastFlagIndex = -1;
  for (let index = 0; index < args.length - 1; index++) {
    if (flagNames.has(args[index])) {
      parsed.flags.add(args[index]);
      lastFlagIndex = index;
      continue;
    }
    if (args[index] !== "-I") continue;
    index++;
    if (index > args.length - 2) return { ...parsed, error: "missing-include" };
    parsed.includes.push(args[index]);
    lastFlagIndex = index;
  }
  return lastFlagIndex === args.length - 2 ? parsed : { ...parsed, error: "several-files" };
};

export const exportXml = (args: string[]) => {
  const parsed = parseXmlExportArgs(args, new Set(["-o", "-t", "-r", "-u"]));
  if (parsed.error) return printXmlExportUsageError(ARGUMENT_ERRORS[parsed.error].message);
  const name = args[args.length - 1];
  if (name === "-help") {
    process.stdout.write(XML_EXPORT_USAGE);
    return EXIT_STATUS.success;
  }
  const fileName = name.endsWith(".tla") ? name : `${name}.tla`;
  const directories = [".", ...parsed.includes];
  const path = directories.map((directory) => resolve(directory, fileName)).find(existsSync);
  if (path === undefined && !SANY_STANDARD_MODULES.has(fileName.slice(0, -".tla".length))) {
    printMissingFile(process.cwd(), `./${fileName}`, parsed.includes);
  }
  const sany = getSanyReport(path ?? fileName, createModuleLoader(directories), {
    fileName: name,
    isXmlExport: true,
  });
  process.stderr.write(sany.text);
  if (sany.isFailed || sany.specification === undefined) {
    console.error("ERROR: Failed to parse module.");
    return XML_EXPORT_EXIT_CODE.specParsingFailure;
  }
  return writeXml(sany.specification, {
    version: "master",
    isRestricted: parsed.flags.has("-r"),
    isUncommented: parsed.flags.has("-u"),
    isTerse: parsed.flags.has("-t"),
  });
};

const printXmlExporterException = (exception: string, line: number) => {
  console.error(
    `Exception in thread "main" ${exception}\n\tat tla2sany.xml.XMLExporter.main(XMLExporter.java:${line})`,
  );
  return XML_EXPORT_EXIT_CODE.uncaughtException;
};

export const exportXml174 = (args: string[], jar: string | undefined) => {
  const parsed = parseXmlExportArgs(args, new Set(["-o"]));
  if (parsed.error) {
    return printXmlExporterException(
      `java.lang.IllegalArgumentException: ${ARGUMENT_ERRORS[parsed.error].message}`,
      ARGUMENT_ERRORS[parsed.error].line174,
    );
  }
  const name = args[args.length - 1];
  const fileName = `${name.replace(/\.tla$/i, "")}.tla`;
  const libraries = (parsed.includes.length === 0 ? ["/"] : parsed.includes).map(toLibraryPath);
  const directories = [".", ...libraries];
  const printMissingFile = (moduleFileName: string) =>
    printMissingFile174(`${libraries[libraries.length - 1]}${moduleFileName}`, libraries, jar);
  const path = directories.map((directory) => resolve(directory, fileName)).find(existsSync);
  if (path === undefined && !SANY_174_STANDARD_MODULES.has(basename(fileName, ".tla"))) {
    printMissingFile(fileName);
    return EXIT_STATUS.success;
  }
  const sany = getSanyReport(
    path ?? fileName,
    reportMissingModules174(createModuleLoader(directories), printMissingFile),
    {
      fileName: name,
      isXmlExport: true,
      version: "1.7.4",
    },
  );
  process.stderr.write(sany.text);
  if (sany.specification === undefined) {
    return printXmlExporterException(
      `tla2sany.xml.XMLExportingException: spec ${(path && getSanyModuleName(readFileSync(path, "utf8"), "1.7.4")) ?? "null"} is malformed - does not have a root module`,
      110,
    );
  }
  return writeXml(sany.specification, {
    version: "1.7.4",
    isRestricted: false,
    isUncommented: false,
    isTerse: true,
  });
};
