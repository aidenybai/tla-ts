import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vite-plus/test";
import { FIXTURES } from "./check-harness";
import { JAR_174, runCliWith } from "./cli-harness";

const XML_EXPORT_FAILURES = [
  [
    "Renamed.tla",
    2,
    [
      "",
      "Fatal errors while parsing TLA+ spec in file Renamed.tla",
      "",
      "Unknown location",
      "",
      "File name 'Renamed' does not match the name 'Other' of the top level module it contains.",
      "*** Errors: 1",
      "",
      "Unknown location",
      "",
      "File name 'Renamed' does not match the name 'Other' of the top level module it contains.",
      "",
      "",
      "",
      "ERROR: Failed to parse module.",
    ],
  ],
  [
    "Nesting.tla",
    2,
    [
      "",
      "Fatal errors while parsing TLA+ spec in file Nesting.tla",
      "",
      "In module Inner",
      "",
      "Cannot find source file for module Absent imported in module Inner.",
      "*** Errors: 1",
      "",
      "In module Inner",
      "",
      "Cannot find source file for module Absent imported in module Inner.",
      "",
      "",
      "",
      "ERROR: Failed to parse module.",
    ],
  ],
  [
    "Twice.tla",
    2,
    [
      "Semantic errors:",
      "",
      "*** Errors: 1",
      "",
      "line 3, col 1 to line 3, col 7 of module Twice",
      "",
      "Operator Op already defined or declared.",
      "",
      "",
      "ERROR: Failed to parse module.",
    ],
  ],
  [
    "LevelError.tla",
    2,
    [
      "Semantic errors:",
      "",
      "*** Errors: 1",
      "",
      "line 8, col 8 to line 8, col 16 of module LevelError",
      "",
      "Level error in applying operator I!Foo:",
      "The level of argument 1 exceeds the maximum level allowed by the operator.",
      "",
      "",
      "ERROR: Failed to parse module.",
    ],
  ],
  [
    "DefineStep.tla",
    1,
    [
      'Exception in thread "main" java.lang.IllegalArgumentException: unsupported kind: 37 in xml export',
    ],
  ],
  [
    "FormFeed.tla",
    7,
    [
      "ERROR: The spec contains the character U+000C in the StringValue element. XML 1.0 cannot represent that character in character data, not even as a numeric character reference, so the spec cannot be exported until the character is removed from it.",
    ],
  ],
  [
    "nested/Root.tla",
    2,
    [
      "",
      "Fatal errors while parsing TLA+ spec in file nested/Root.tla",
      "",
      "In module Root",
      "",
      "Cannot find source file for module Sibling imported in module Root.",
      "*** Errors: 1",
      "",
      "In module Root",
      "",
      "Cannot find source file for module Sibling imported in module Root.",
      "",
      "",
      "",
      "ERROR: Failed to parse module.",
    ],
  ],
  [
    "nested/Unparsed",
    2,
    [
      "***Parse Error***",
      'Encountered "====" at line 3, column 1 and token "+" ',
      "",
      "Residual stack trace follows:",
      "ExtendableExpr starting at line 3, column 1.",
      "ExtendableExpr starting at line 2, column 7.",
      "Expression starting at line 2, column 7.",
      "Definition starting at line 2, column 1.",
      "Module body starting at line 2, column 1.",
      "",
      "",
      "Fatal errors while parsing TLA+ spec in file nested/Unparsed",
      "",
      "In module Unparsed",
      "",
      "Could not parse module Unparsed from file nested/Unparsed.tla",
      "*** Errors: 1",
      "",
      "In module Unparsed",
      "",
      "Could not parse module Unparsed from file nested/Unparsed.tla",
      "",
      "",
      "",
      "ERROR: Failed to parse module.",
    ],
  ],
] as const;

const exportXml = (args: string[]) =>
  runCliWith("xml-export", ["tla2sany.xml.XMLExporter", "-o", ...args]);

describe("the CLI exports XML like SANY's XMLExporter", () => {
  it.each(XML_EXPORT_FAILURES)("fails on %s", (file, code, lines) => {
    const result = exportXml([file]);
    expect(result.status).toBe(code);
    expect(result.stdout).toBe("");
    expect(result.stderr).toBe([...lines, ""].join("\n"));
  });

  it("writes the XML that XMLExporter writes, with SANY's UIDs in the order of its HashMap", () => {
    const result = exportXml(["Numbered.tla"]);
    expect(result.status).toBe(0);
    expect(result.stdout).toBe(readFileSync(join(FIXTURES, "xml-export", "Numbered.xml"), "utf8"));
  });

  it("writes the XML of the root module alone, unboxed and on one line, as XMLExporter does", () => {
    const result = exportXml(["-t", "-r", "-u", "Commented.tla"]);
    expect(result.status).toBe(0);
    expect(result.stdout).toBe(readFileSync(join(FIXTURES, "xml-export", "Commented.xml"), "utf8"));
  });

  it("prints its usage for -help, and with an error for an argument it does not know", () => {
    const help = exportXml(["-help"]);
    expect(help.status).toBe(0);
    expect(help.stdout.split("\n").slice(0, 4)).toEqual([
      "",
      "\x1b[1mNAME\x1b[0m",
      "",
      "\ttla2sany.xml.XMLExporter - Emit SANY's parse tree as XML - Version 2.2 created 08 July 2020",
    ]);
    const unknown = exportXml(["-x", "Commented.tla"]);
    expect(unknown.status).toBe(1);
    expect(unknown.stderr).toBe(`ERROR: Only one TLA file to check allowed!\n${help.stdout}`);
  });

  it("finds the root module and the modules it extends in the -I directories", () => {
    const result = exportXml(["-I", "nested", "Root"]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("<RootModule>Root</RootModule>");
  });

  it("names the file of a root module it cannot find and where it looked", () => {
    const directory = join(FIXTURES, "xml-export");
    const result = exportXml(["-I", "nested", "Missing"]);
    expect(result.status).toBe(2);
    expect(result.stderr.split("\n").slice(0, 7)).toEqual([
      `File does not exist: ${directory}/./Missing.tla while looking in these directories: ${directory}, nested, classpath:/tla2sany/StandardModules, classpath:/`,
      "",
      "Fatal errors while parsing TLA+ spec in file Missing",
      "",
      "Unknown location",
      "",
      "Cannot find source file for module Missing",
    ]);
  });
});

const exportXml174 = (args: string[]) =>
  runCliWith("xml-export", ["-cp", JAR_174, "tla2sany.xml.XMLExporter", ...args]);

const getXmlExporterException = (exception: string, line: number) =>
  `Exception in thread "main" ${exception}\n\tat tla2sany.xml.XMLExporter.main(XMLExporter.java:${line})\n`;

describe("the CLI exports XML like TLC 1.7.4's XMLExporter when its jar is on the class path", () => {
  const standardModules = `jar:file:${pathToFileURL(JAR_174).pathname}!/tla2sany/StandardModules/`;

  it("writes the XML on one line, after the modules SANY analyzes", () => {
    const result = exportXml174(["-o", "Counted.tla"]);
    expect(result.status).toBe(0);
    expect(result.stdout).toBe(
      readFileSync(join(FIXTURES, "xml-export", "Counted.1.7.4.xml"), "utf8"),
    );
    expect(result.stderr).toBe(
      "Semantic processing of module Naturals\nSemantic processing of module Counted\n",
    );
  });

  it("writes the XML of a specification SANY finds errors in", () => {
    const result = exportXml174(["-o", "Twice.tla"]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("<RootModule>Twice</RootModule>");
    expect(result.stderr).toMatch(/^Semantic processing of module Twice\nSemantic errors:\n/);
  });

  it.each([
    [[], "at least one .tla file must be given", 59],
    [["-t", "Counted.tla"], "Only one TLA file to check allowed!", 83],
  ])("throws on the arguments %j", (args, message, line) => {
    const result = exportXml174(args);
    expect(result.status).toBe(1);
    expect(result.stderr).toBe(
      getXmlExporterException(`java.lang.IllegalArgumentException: ${message}`, line),
    );
  });

  it("names the last file it looked for of a module it cannot find", () => {
    const directory = join(FIXTURES, "xml-export");
    expect(exportXml174(["Missing.tla"])).toMatchObject({
      status: 0,
      stdout: "",
      stderr: `File does not exist: /Missing.tla while looking in these directories: /, ${standardModules}\n`,
    });
    expect(exportXml174(["-I", "nested", "Missing.tla"]).stderr).toBe(
      `File does not exist: ${directory}/nested/Missing.tla while looking in these directories: nested/, ${standardModules}\n`,
    );
  });

  it("throws for a specification SANY aborts on, which it names once it parses the root module", () => {
    const renamed = exportXml174(["-o", "Renamed.tla"]);
    expect(renamed.status).toBe(1);
    expect(renamed.stderr).toBe(
      [
        "",
        "Fatal errors while parsing TLA+ spec in file Renamed.tla",
        "",
        "tla2sany.semantic.AbortException",
        "*** Abort messages: 1",
        "",
        "Unknown location",
        "",
        "File name 'Renamed' does not match the name 'Other' of the top level module it contains.",
        "",
        "",
        getXmlExporterException(
          "tla2sany.xml.XMLExportingException: spec Other is malformed - does not have a root module",
          110,
        ),
      ].join("\n"),
    );
    expect(exportXml174(["-o", "Numbered.tla"]).stderr).toContain(
      "spec null is malformed - does not have a root module",
    );
  });
});
