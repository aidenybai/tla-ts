import { PcalError, PcalRuntimeError } from "./errors";
import {
  formatPcalNode,
  getPcalLocation,
  getPcalVersionNumber,
  PCAL_VERSION_WEIGHT,
  type PcalAlgorithm,
} from "./pcal-ast";
import { parsePcalAlgorithm, type PcalSession } from "./pcal-parse";
import { createPcalCharReader } from "./pcal-tokenize";
import { translatePcalAlgorithm } from "./pcal-translate";
import type { TlcVersion } from "./tlc-version";

// Validator.ValidationResult.
type PcalValidationResult =
  | "NO_PLUSCAL_EXISTS"
  | "NO_TRANSLATION_EXISTS"
  | "NO_PCAL_CHECKSUMS_EXIST"
  | "TLA_DIVERGENCE_EXISTS"
  | "PCAL_DIVERGENCE_EXISTS"
  | "ERROR_ENCOUNTERED"
  | "NO_DIVERGENCE";

// Java's \s, which unlike JavaScript's matches no Unicode spaces.
const SPACE = "[ \\t\\n\\x0B\\f\\r]";

// Validator.CHECKSUM_PATTERN, whose (?i) groups become character classes.
const CHECKSUM_PATTERN = new RegExp(
  `\\\\\\* BEGIN TRANSLATION${SPACE}+\\(${SPACE}*([cC][hH]([eE][cC])?[kK][sS][uU][mM]\\([pP]([lL][uU][sS])?[cC][aA][lL]\\))${SPACE}*(=${SPACE}*"(?<pcal>[0-9A-Fa-f]*)"|\\\\in${SPACE}*STRING)${SPACE}*\\/\\\\${SPACE}*([cC][hH]([eE][cC])?[kK][sS][uU][mM]\\([tT][lL][aA]\\+?\\))${SPACE}*(=${SPACE}*"(?<tla>[0-9A-Fa-f]*)"|\\\\in${SPACE}*STRING)${SPACE}*\\)`,
);

// Validator.checksum: CRC32 of the string's bytes, in Long.toHexString's unpadded lowercase hex.
// Only a spec with PlusCal needs node:zlib, so it loads then rather than at startup.
const getChecksum = (text: string) =>
  process.getBuiltinModule("node:zlib").crc32(Buffer.from(text, "utf8")).toString(16);

const reportUnrecoverableError = (session: PcalSession, message: string) =>
  session.log(`\nUnrecoverable error:\n -- ${message}.\n`);

// PcalDebug.reportError: an UnrecoverablePositionedException names its statement's position.
const reportPcalError = (session: PcalSession, error: PcalError) =>
  reportUnrecoverableError(
    session,
    error.node === undefined || error.node.line === 0
      ? error.message
      : `${error.message}\n    at ${getPcalLocation(error.node)}`,
  );

// trans.removeTabs: tabs reach the next multiple of 8, and every line gets a trailing space.
const removeTabs = (lines: string[]) =>
  lines.map(
    (line) =>
      `${Array.from(line).reduce(
        (result, char) =>
          char === "\t" ? result + " ".repeat(8 - (result.length % 8)) : result + char,
        "",
      )} `,
  );

// trans.findTokenPair: the first line from start with first followed by second after spaces.
const findTokenPair = (lines: string[], start: number, first: string, second: string) => {
  for (let index = Math.max(start, 0); index < lines.length; index++) {
    const line = lines[index];
    const column = line.indexOf(first);
    if (column === -1) continue;
    const afterFirst = column + first.length;
    const spaces = line.slice(afterFirst).search(/[^ ]/);
    if (spaces !== -1 && afterFirst + spaces === line.indexOf(second)) return index;
  }
  return -1;
};

interface PcalSearchLocation {
  line: number;
  column: number;
}

// ParseAlgorithm.GotoNextNonSpace: moves the location to the next character that isn't a space,
// returning its line, or "" past the last line.
const gotoNextNonSpace = (lines: string[], location: PcalSearchLocation) => {
  while (location.line < lines.length) {
    const line = lines[location.line];
    while (location.column < line.length && line[location.column] === " ") location.column += 1;
    if (location.column < line.length) return line;
    location.line += 1;
    location.column = 0;
  }
  return "";
};

// ParseAlgorithm.NextSpaceCol and NextDelimiterCol: the first delimiter from column on, or the
// end of the line.
const getNextDelimiter = (line: string, column: number, delimiters: string) => {
  const index = Array.from(line.slice(column)).findIndex((char) => delimiters.includes(char));
  return index === -1 ? line.length : column + line.slice(column, column + index).length;
};

const isIdChar = (char: string) => /^[\p{L}\p{Nd}_]$/u.test(char);

// ParseAlgorithm.FindToken: moves the location past the next occurrence of token that starts a
// word and isn't followed by a letter or "_".
const findToken = (lines: string[], location: PcalSearchLocation, token: string) => {
  while (location.line < lines.length) {
    const line = gotoNextNonSpace(lines, location);
    if (line.slice(location.column).startsWith(token)) {
      const end = location.column + token.length;
      if (end >= line.length || !/^[\p{L}_]$/u.test(line[end])) {
        location.column = getNextDelimiter(line, end, " ");
        return true;
      }
    }
    location.column = getNextDelimiter(line, location.column, " ");
  }
  return false;
};

// trans.CommandLineError.
const reportCommandLineError = (session: PcalSession, message: string) =>
  reportUnrecoverableError(session, `Command-line error: ${message}`);

// trans.parseAndProcessArguments for the options of a "PlusCal options" statement, which set the
// translator's options for the rest of SANY's run.
const processOptionArguments = (session: PcalSession, args: string[]) => {
  const params = session.params;
  const fairness = { isFirst: true, isExplicitNof: false };
  const setFairness = (option: string) => {
    if (fairness.isFirst) {
      params.fairnessOption = "";
      fairness.isFirst = false;
    }
    if (params.fairnessOption !== "") {
      reportCommandLineError(session, "Can only have one of -wf, -sf, -wfNext, and -nof options");
      return false;
    }
    params.fairnessOption = option;
    return true;
  };
  for (let index = 0; index < args.length; index++) {
    const option = args[index];
    const argument = args[index + 1];
    switch (option) {
      case "-spec":
      case "spec":
      case "-myspec":
      case "myspec": {
        const isMyspec = option.endsWith("myspec");
        params[isMyspec ? "myspecOption" : "specOption"] = true;
        if (params.specOption && params.myspecOption) {
          reportCommandLineError(
            session,
            "\nCan have at most one of the options -spec, -myspec, -spec2, -myspec2, writeAST",
          );
          return;
        }
        if (argument === undefined) {
          reportCommandLineError(
            session,
            `Specification name must follow \`-${isMyspec ? "myspec" : "spec"}' option`,
          );
          return;
        }
        params.specFile = argument;
        index += 1;
        continue;
      }
      case "-termination":
      case "termination":
        params.checkTermination = true;
        continue;
      case "-noold":
        params.noOld = true;
        continue;
      case "-nocfg":
        params.nocfg = true;
        continue;
      case "-noDoneDisjunct":
      case "noDoneDisjunct":
        params.noDoneDisjunct = true;
        continue;
      case "-wf":
      case "wf":
      case "-sf":
      case "sf":
      case "-wfNext":
      case "wfNext":
      case "-nof":
      case "nof":
        if (!setFairness(option.replace(/^-/, ""))) return;
        if (option.endsWith("nof")) fairness.isExplicitNof = true;
        continue;
      case "-label":
      case "label":
        params.labelFlag = true;
        continue;
      case "-labelRoot":
      case "labelRoot":
        if (argument === undefined) {
          reportCommandLineError(session, "Label root must follow `-labelRoot' option");
          return;
        }
        if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(argument)) {
          reportCommandLineError(
            session,
            "Label root must be a valid PlusCal identifier (must start with a letter and contain only letters, numbers, and underscores)",
          );
          return;
        }
        params.labelRoot = argument;
        index += 1;
        continue;
      case "-version":
      case "version": {
        if (argument === undefined) {
          reportCommandLineError(session, "Version number must follow `-version' option");
          return;
        }
        // PcalParams.ProcessVersion.
        const version = getPcalVersionNumber(argument);
        if (version < 0 || version > PCAL_VERSION_WEIGHT) {
          reportUnrecoverableError(
            session,
            version < 0
              ? `Illegal version ${argument} specified.`
              : `Specified version ${argument} later than current version 1.12`,
          );
          reportCommandLineError(session, "Bad version number");
          return;
        }
        params.inputVersionNumber = version;
        index += 1;
        continue;
      }
      case "-lineWidth":
        // PcalTLAGen's line width only shapes the translation's text.
        if (!/^[+-]?\d+$/.test(argument ?? "") || Number(argument) < 60) {
          reportCommandLineError(
            session,
            "Integer value at least 60 must follow `-lineWidth' option",
          );
          return;
        }
        index += 1;
        continue;
      default:
        reportCommandLineError(
          session,
          `Unknown or illegal option in options statement: ${option}`,
        );
        return;
    }
  }
  if (params.checkTermination && params.fairnessOption === "" && !fairness.isExplicitNof) {
    params.fairnessOption = "wf";
  }
};

// ParseAlgorithm.ProcessOptions: the location is just past "PlusCal".
const processOptions = (session: PcalSession, lines: string[], location: PcalSearchLocation) => {
  gotoNextNonSpace(lines, location);
  location.column += "options".length;
  const afterOptions = gotoNextNonSpace(lines, location);
  if (!afterOptions.slice(location.column).startsWith("(")) {
    reportUnrecoverableError(session, "`PlusCal options' not followed by '('");
    return;
  }
  location.column += 1;
  const args: string[] = [];
  for (;;) {
    const line = gotoNextNonSpace(lines, location);
    if (location.line >= lines.length || line[location.column] === ")") break;
    if (line[location.column] === ",") {
      location.column += 1;
      continue;
    }
    const end = getNextDelimiter(line, location.column, " ,)");
    args.push(line.slice(location.column, end));
    location.column = end;
  }
  if (location.line >= lines.length) {
    reportUnrecoverableError(session, "No closing ')' found in options statement");
    return;
  }
  processOptionArguments(session, args);
};

// ParseAlgorithm.uncomment: blanks out the comment delimiters and nested comments from the
// algorithm's start to the "*)" that ends the comment it is in, dropping the rest of that line,
// and returns the error it throws for a line that ends in a string.
const uncomment = (lines: string[], startLine: number, startColumn: number) => {
  const scan = { depth: 0, isDone: false, isInString: false };
  for (let index = startLine; !scan.isDone && index < lines.length; index++) {
    const line = lines[index];
    const start = index === startLine ? startColumn : 0;
    const output = [line.slice(0, start)];
    scan.isInString = false;
    for (let column = start; !scan.isDone && column < line.length; column++) {
      const char = line[column];
      const pair = line.slice(column, column + 2);
      if (pair === "(*" && !scan.isInString) {
        scan.depth += 1;
        output.push("  ");
        column += 1;
        continue;
      }
      if (pair === "*)" && !scan.isInString && scan.depth === 0) {
        output.push(pair);
        scan.isDone = true;
        continue;
      }
      if (pair === "*)" && !scan.isInString) {
        scan.depth -= 1;
        output.push("  ");
        column += 1;
        continue;
      }
      if (scan.depth > 0) {
        output.push(" ");
        continue;
      }
      if (scan.isInString && char === "\\" && pair.length === 2) {
        output.push(pair);
        column += 1;
        continue;
      }
      if (!scan.isInString && pair === "\\*") {
        output.push(" ");
        break;
      }
      if (char === '"') scan.isInString = !scan.isInString;
      output.push(char);
    }
    if (scan.isInString) return new PcalError(`Unterminated string in line ${index + 1}`);
    lines[index] = output.join("");
  }
  return undefined;
};

// Vector.get on an index out of its range, whose message names the vector's capacity: the 10 it
// starts with, doubled as it grows.
const throwIndexOutOfBounds = (index: number, size: number): never => {
  const capacity = 10 * 2 ** Math.max(0, Math.ceil(Math.log2(size / 10)));
  throw new PcalRuntimeError(
    `java.lang.ArrayIndexOutOfBoundsException: Index ${index} out of bounds for length ${capacity}`,
  );
};

// Validator.validate: checks the PlusCal algorithm of the module whose lines are given, from its
// first to its last, against the checksums its translation records.
export const validatePcalModule = (
  session: PcalSession,
  specificationText: string[],
  version?: TlcVersion,
): Set<PcalValidationResult> => {
  if (!specificationText.some((line) => line.indexOf("algorithm") > 0)) {
    return new Set(["NO_PLUSCAL_EXISTS"]);
  }
  const lines = removeTabs(specificationText);
  const searchLocation = { line: 0, column: 0 };
  while (findToken(lines, searchLocation, "PlusCal")) {
    const line = gotoNextNonSpace(lines, searchLocation);
    const rest = line.slice(searchLocation.column);
    const idEnd = Array.from(rest).findIndex((char) => !isIdChar(char));
    if (rest.startsWith("options") && (idEnd === -1 ? rest.length : idEnd) === 7) {
      session.params.optionsInFile = true;
      processOptions(session, lines, searchLocation);
      break;
    }
  }
  const begin = { line: 0, column: -1, isFound: false, isFair: false };
  for (; begin.line < lines.length; begin.line++) {
    const line = lines[begin.line];
    // TLAConstants.MODULE_CLOSING_REGEX, which the trailing space removeTabs adds keeps from
    // matching.
    if (/^=+$/.test(line)) break;
    const algorithmColumn = line.indexOf("--algorithm");
    const fairColumn = line.indexOf("--fair");
    if (algorithmColumn !== -1) {
      begin.column = algorithmColumn + "--algorithm".length;
      begin.isFound = true;
      break;
    }
    if (fairColumn !== -1) {
      begin.column = fairColumn + "--fair".length;
      begin.isFound = true;
      begin.isFair = true;
      break;
    }
  }
  const results = new Set<PcalValidationResult>();
  const translationLine = findTokenPair(lines, 0, "BEGIN", "TRANSLATION");
  if (translationLine === -1) results.add("NO_TRANSLATION_EXISTS");
  const endTranslationLine = findTokenPair(lines, translationLine + 1, "END", "TRANSLATION");
  if (endTranslationLine === -1) results.add("NO_TRANSLATION_EXISTS");
  if (translationLine === -1 && endTranslationLine === -1) return results;
  if (!begin.isFound) {
    results.add("NO_PLUSCAL_EXISTS");
    return results;
  }
  const uncommentError = uncomment(lines, begin.line, begin.column);
  if (uncommentError !== undefined) {
    reportPcalError(session, uncommentError);
    return new Set(["ERROR_ENCOUNTERED"]);
  }
  const parsed: { ast: PcalAlgorithm | undefined } = { ast: undefined };
  // HACK: Validator reports the exceptions of ParseAlgorithm.getAlgorithm and PCalTLAGenerator
  // and goes on to compare the checksums.
  try {
    const reader = createPcalCharReader(
      lines,
      begin.line,
      begin.column,
      specificationText.length,
      0,
    );
    const result = parsePcalAlgorithm(session, reader, begin.isFair);
    parsed.ast = result.ast;
    translatePcalAlgorithm(result.ast, result.omitPC, result.hasDefaultInitialization, session.log);
  } catch (error) {
    if (!(error instanceof PcalError)) throw error;
    reportPcalError(session, error);
  }
  if (translationLine === -1) throwIndexOutOfBounds(-1, lines.length);
  const match = CHECKSUM_PATTERN.exec(lines[translationLine]);
  if (match === null) {
    results.add("NO_PCAL_CHECKSUMS_EXIST");
    return results;
  }
  const pcalChecksum = match.groups?.pcal;
  // The Java checksums the string "fair" for a --fair algorithm, unlike TLC 1.7.4's, and a failed
  // parse leaves an AST whose text, Object.toString's class name and hash code, matches no checksum.
  const algorithmText =
    begin.isFair && version !== "1.7.4"
      ? "fair"
      : parsed.ast === undefined
        ? undefined
        : formatPcalNode(parsed.ast, session.params.inputVersionNumber, version);
  if (
    pcalChecksum !== undefined &&
    (algorithmText === undefined || pcalChecksum !== getChecksum(algorithmText))
  ) {
    results.add("PCAL_DIVERGENCE_EXISTS");
  }
  const tlaChecksum = match.groups?.tla;
  if (tlaChecksum !== undefined) {
    if (endTranslationLine === -1) {
      throw new PcalRuntimeError(
        `java.lang.IllegalArgumentException: fromIndex(${translationLine + 1}) > toIndex(-1)`,
      );
    }
    const translation = specificationText.slice(translationLine + 1, endTranslationLine).join("");
    if (tlaChecksum !== getChecksum(translation)) results.add("TLA_DIVERGENCE_EXISTS");
  }
  return results.size === 0 ? new Set(["NO_DIVERGENCE"]) : results;
};
