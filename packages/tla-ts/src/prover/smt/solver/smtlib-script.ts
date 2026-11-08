// Ported from Z3 (src/cmd_context/cmd_context.cpp, src/cmd_context/basic_cmds.cpp,
// src/parsers/smt2/smt2parser.cpp), MIT license, see z3-license.txt. Runs an SMT-LIB script the way
// `z3 file.smt2` does, and prints each line that Z3 prints: an answer for each check-sat, the output
// of the commands that print, and an error for each command that fails. It throws
// SmtUnsupportedError at a command or a term the port does not implement.
import {
  isStackOverflow,
  SmtCanceledError,
  SmtParseError,
  SmtUnsupportedError,
} from "../../../errors";
import type { DecideOptions } from "../../verdict";
import { AstManager } from "./ast";
import { ResourceLimit } from "./rlimit";
import {
  createCommandReader,
  createSmtlibReader,
  DECLARATIONS,
  isSymbol,
  type SmtList,
  type SmtlibReader,
} from "./smtlib-parser";
import { getVerdict, solveAssertions } from "./solver";

// The commands that print success when :print-success is on.
const SILENT_COMMANDS = new Set([
  ...DECLARATIONS,
  "assert",
  "push",
  "pop",
  "reset",
  "reset-assertions",
  "set-logic",
  "set-option",
  "set-info",
]);

// smt2parser's parse_opt_unsigned: the number of scopes of push and pop, 1 when left out.
const getScopeCount = (list: SmtList, command: string) => {
  const argument = list.items[1];
  if (argument === undefined) return 1;
  if (argument.kind !== "numeral")
    throw new SmtParseError(`invalid ${command} command, integer expected`, argument);
  if (argument.text.startsWith("-"))
    throw new SmtParseError(`invalid ${command} command, value is negative.`, list.end);
  return Number(argument.text);
};

interface ScriptState {
  manager: AstManager;
  reader: SmtlibReader;
  assertions: number[];
  // The number of assertions when each scope began.
  scopes: number[];
}

export const runSmtlibScript = (
  text: string,
  options: DecideOptions,
  print: (line: string) => void,
) => {
  const commands = createCommandReader(text);
  const createState = (): ScriptState => {
    const manager = new AstManager(
      new ResourceLimit(Date.now() + options.timeLimitMs, options.signal),
    );
    return { manager, reader: createSmtlibReader(manager), assertions: [], scopes: [] };
  };
  let state = createState();
  const settings = { isPrintingSuccess: false, isMbqi: true };
  const report = (error: SmtParseError) =>
    print(`(error "line ${error.line} column ${error.column}: ${error.message}")`);
  const checkSat = (extra: number[]) => {
    state.manager.limit.restart(Date.now() + options.timeLimitMs);
    const solved = (() => {
      try {
        return solveAssertions(state.manager, [...state.assertions, ...extra], settings.isMbqi)
          .result;
      } catch (error) {
        if (error instanceof SmtCanceledError || isStackOverflow(error)) return undefined;
        throw error;
      }
    })();
    print(solved === undefined ? "unknown" : getVerdict(solved));
  };
  const run = (list: SmtList) => {
    const head = list.items[0];
    if (!isSymbol(head))
      throw new SmtParseError("invalid command, symbol expected", head ?? list.end);
    const name = head.text;
    if (DECLARATIONS.has(name)) state.reader.declareCommand(list);
    else if (name === "assert")
      state.assertions.push(state.reader.parseFormula(list.items[1] ?? list.end));
    // check-sat takes assumptions as check-sat-assuming does.
    else if (name === "check-sat")
      checkSat(list.items.slice(1).map((literal) => state.reader.parseFormula(literal)));
    // The smt tactic is the solver that check-sat runs.
    else if (
      name === "check-sat-using" &&
      isSymbol(list.items[1], "smt") &&
      list.items.length === 2
    )
      checkSat([]);
    else if (name === "check-sat-assuming") {
      const literals = list.items[1];
      if (literals?.kind !== "list")
        throw new SmtParseError(
          "invalid check-sat-assuming command, '(' expected",
          literals ?? list.end,
        );
      checkSat(literals.items.map((literal) => state.reader.parseFormula(literal)));
    } else if (name === "push") {
      const count = getScopeCount(list, name);
      for (let index = 0; index < count; index++) {
        state.scopes.push(state.assertions.length);
        state.reader.push();
      }
    } else if (name === "pop") {
      const count = getScopeCount(list, name);
      if (count > state.scopes.length)
        throw new SmtParseError(
          "invalid pop command, argument is greater than the current stack depth",
          list.end,
        );
      for (let index = 0; index < count; index++) {
        state.assertions.length = state.scopes.pop() ?? 0;
        state.reader.pop();
      }
    } else if (name === "reset") {
      state = createState();
      settings.isPrintingSuccess = false;
    } else if (name === "reset-assertions") {
      state.assertions = [];
      state.scopes = state.scopes.map(() => 0);
    } else if (name === "echo") {
      const message = list.items[1];
      if (message?.kind !== "string")
        throw new SmtParseError("invalid echo command, string expected", message ?? list.end);
      print(message.text);
    } else if (name === "set-option") {
      const option = list.items[1];
      const value = list.items[2];
      // gparams reads an option name without its case and with - as _.
      const optionName =
        option?.kind === "keyword" ? option.text.toLowerCase().replaceAll("-", "_") : "";
      const isTrue = value?.kind === "symbol" && value.text === "true";
      if (optionName === ":print_success") settings.isPrintingSuccess = isTrue;
      if (optionName === ":smt.mbqi") settings.isMbqi = isTrue;
    } else if (name === "set-logic") {
      const logic = list.items[1];
      if (!isSymbol(logic))
        throw new SmtParseError("invalid logic name, symbol expected", logic ?? list.end);
      state.reader = createSmtlibReader(state.manager, logic.text);
    } else if (name !== "set-info") throw new SmtUnsupportedError(`the command ${name}`);
    if (settings.isPrintingSuccess && SILENT_COMMANDS.has(name)) print("success");
  };
  for (;;) {
    try {
      const list = commands.read();
      if (list === undefined) break;
      if (isSymbol(list.items[0], "exit")) break;
      run(list);
    } catch (error) {
      if (!(error instanceof SmtParseError)) throw error;
      report(error);
      commands.skip(report);
    }
  }
};
