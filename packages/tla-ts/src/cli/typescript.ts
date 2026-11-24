import type { Node, SourceFile, ThrowStatement } from "@typescript/typescript6";
import type { PreparedModule } from "../tlc/order";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import type { Module } from "../ast";
import {
  MODULE_UNCAUGHT_LOCATION,
  TRACE_UNCAUGHT_HINT,
  UNCAUGHT_EXCEPTION_EXIT_CODE,
  UNHANDLED_REJECTION_LOCATION,
  UNHANDLED_REJECTION_PREFIX,
  UNHANDLED_REJECTION_SUFFIX,
  UNSETTLED_AWAIT_EXIT_CODE,
  UNSETTLED_AWAIT_WARNING,
} from "../exit-codes";
import { getEscoreRuntime } from "../compile";
import { parseConfig } from "../config";
import { TlaError, TlaSharedBaseError, TlaStrippingError } from "../errors";
import { KEY_SEPARATOR } from "../resolve";
import type { CheckBase } from "../search";
import type { TlcVersion } from "../tlc/version";
import { parseModule } from "../parser";
import { printModule } from "../printer";
import { foldNames } from "../typescript/spec/library";
import { getPatchedUnits } from "../typescript/spec/units";
import type { ProgramFile } from "../typescript/spec/specialize";

// A spec tla-ts compiled from the TypeScript file at path. specPath is where its module would be
// if it were a file, though tla-ts checks it without writing one.
export interface CompiledInput {
  path: string;
  specPath: string;
  source: Module;
  config: string;
  loadModule: (name: string) => string | undefined;
  preparedModules: PreparedModule[];
  isScript: boolean;
  notes: string[];
  // The frame of a model, which a script has none of.
  frame?: string;
  // The base of the group of files whose program this file's spec shares, which its check starts
  // from, and the strings in the order the check ranks them.
  base?: CheckBase;
  strings?: readonly string[];
}

// Whether a path names a file that Node runs, TypeScript or JavaScript, which tla-ts compiles.
export const isProgramPath = (path: string) => /\.(?:[cm]?[jt]s|[jt]sx)$/.test(path);

// The escapes of a string that TLC prints.
const TLC_ESCAPES = new Map([
  ["n", "\n"],
  ["t", "\t"],
]);

// The escapes of a TLA+ string literal, which TLC reads and prints.
const TLA_ESCAPES = new Map([
  ['"', '\\"'],
  ["\\", "\\\\"],
  ["\n", "\\n"],
  ["\t", "\\t"],
]);

// Whether a TLA+ string holds a text as Node writes it, which TLC prints as it holds it: a text of
// no control character but a tab or a line feed, and of no surrogate without its pair, which Node
// writes as U+FFFD.
const isNodeText = (text: string) =>
  text.isWellFormed() &&
  [...text].every((character) => {
    const code = character.codePointAt(0) ?? 0;
    return code === 9 || code === 10 || (code >= 32 && code < 127) || code > 159;
  });

// The TLA+ string literal of a text.
const getTlaString = (text: string) =>
  `"${text.replace(/["\\\n\t]/g, (character) => TLA_ESCAPES.get(character) ?? character)}"`;

// What Node writes to stderr and the code it exits with, for the script at path whose spec fails an
// Assert with what Node reports: a top-level await that never settles, or a throw or a rejection
// that nothing handles.
export const getNodeExit = (message: string) => {
  const quoted = message
    .split('The first argument of Assert evaluated to FALSE; the second argument was:\n"')
    .at(1);
  if (quoted === undefined) return undefined;
  const text = quoted
    .slice(0, -1)
    .replace(/\\(.)/g, (_, character: string) => TLC_ESCAPES.get(character) ?? character);
  if (text.startsWith(UNSETTLED_AWAIT_WARNING)) {
    return { code: UNSETTLED_AWAIT_EXIT_CODE, stderr: `Warning: ${text}\n\n\n\n` };
  }
  // Node's text starts where it says the exception is, in a file of the program, by its path or
  // its URL, or in Node's own code.
  const isNodeLocation = /^(?:file:\/\/|\/|[A-Za-z]:\\|node:internal\/)[^\n]*:\d+\n/.test(
    text.replace(/^\n/, ""),
  );
  return isNodeLocation
    ? { code: UNCAUGHT_EXCEPTION_EXIT_CODE, stderr: `${text}\n\nNode.js ${process.version}\n` }
    : undefined;
};

// The prototypes whose objects Node's inspect names by the constructor it knows, whatever their
// constructor property says (wellKnownPrototypes of lib/internal/util/inspect.js).
const WELL_KNOWN_PROTOTYPES = [
  "Array",
  "ArrayBuffer",
  "Function",
  "Map",
  "Set",
  "Object",
  "TypedArray",
  "RegExp",
  "Date",
  "DataView",
  "Error",
  "AggregateError",
  "RangeError",
  "TypeError",
  "Boolean",
  "Number",
  "String",
  "Promise",
  "WeakMap",
  "WeakSet",
];

// What Node prints of an error that nothing caught, but the lines of its stack's frames, which
// tla-ts doesn't print: the inspection of the error that a fatal exception prints (afterInspector
// of lib/internal/errors.js, and formatError of lib/internal/util/inspect.js), of an error whose
// properties are data and whose own keys Node hides, or Empty where tla-ts can't tell what Node
// prints. An error's stack that no read wrote yet is its header and, where V8 captured a frame, a
// frame, which is all that Node's inspect reads of it but for the frames.
// What Node shows of a file of a program: its number in the program, its URL, its lines by number,
// and the location of each of its throw statements by its number, from 1, in the file's order.
interface NodeFile {
  number: number;
  url: string;
  lines: ReadonlyMap<number, string>;
  sites: ReadonlyMap<number, string>;
}

const ERROR_TEXT = String.raw`NodeStartsWith(u, p) == Len(u) >= Len(p) /\ SubSeq(u, 1, Len(p)) = p
NodeEndsWith(u, p) == Len(u) >= Len(p) /\ SubSeq(u, Len(u) - Len(p) + 1, Len(u)) = p
NodeIncludes(u, p) == StringIndexOf(u, p, 0) # -1
\* The value of the property k that the object o has or inherits, which no accessor gives, as Get
\* gives it, or Empty where an accessor does.
RECURSIVE NodeDataGet(_, _, _)
NodeDataGet(s, o, k) ==
  IF o = Null THEN Undefined ELSE
  LET d == OrdinaryGetOwnProperty(O(s, o), k) IN
  IF d = Absent THEN NodeDataGet(s, O(s, o).proto, k) ELSE IF IsDataDescriptor(d) THEN d.value ELSE Empty
\* getNodeConstructorName: the name of the first constructor of the prototypes of v, or Empty.
RECURSIVE NodeConstructorName(_, _, _)
NodeConstructorName(s, v, p) ==
  IF p = Null THEN Empty ELSE
  LET known == {k \in {${WELL_KNOWN_PROTOTYPES.map((name) => `<<"${name}Prototype", N("${name}")>>`).join(", ")}} :
                  k[1] \in DOMAIN s.realm /\ SameValue(p, Intrinsic(s, k[1]))}
      d == OrdinaryGetOwnProperty(O(s, p), SV("constructor"))
      f == IF d # Absent /\ IsDataDescriptor(d) /\ IsCallable(s, d.value) THEN d.value ELSE Empty
      name == IF f = Empty THEN Empty ELSE NodeDataGet(s, f, SV("name"))
      instance == IF f = Empty \/ name = Empty \/ ~IsString(name) \/ name.value = <<>> THEN Empty
                  ELSE IF ~SameValue(NodeDataGet(s, f, SymHasInstance), NodeDataGet(s, Intrinsic(s, "FunctionPrototype"), SymHasInstance)) THEN Empty
                  ELSE LET h == OrdinaryHasInstance(s, f, v) IN IF IsAbrupt(h) THEN False ELSE Val(h)
  IN IF known # {} THEN (CHOOSE k \in known : TRUE)[2]
     ELSE IF f # Empty /\ (name = Empty \/ (IsString(name) /\ name.value # <<>> /\ instance = Empty)) THEN Empty
     ELSE IF instance = True THEN name.value
     ELSE NodeConstructorName(s, v, O(s, p).proto)
\* improveStack: the stack with the constructor's name where the error's name ends in Error.
NodeImproveStack(stack, constructor, name, tag) ==
  LET dot == StringLastIndexOf(tag, <<46>>, Len(tag) - 1)
      prefix == IF tag = <<>> THEN constructor
                ELSE IF constructor = (IF dot >= 1 THEN SubSeq(tag, dot + 2, Len(tag)) ELSE tag) THEN tag
                ELSE constructor \o N(" [") \o tag \o N("]")
      len == Len(name)
  IN IF NodeEndsWith(name, N("Error")) /\ NodeStartsWith(stack, name) /\ (Len(stack) = len \/ stack[len + 1] \in {10, 58}) /\ name # prefix
     THEN IF NodeIncludes(prefix, name) THEN prefix \o SubSeq(stack, len + 1, Len(stack))
          ELSE prefix \o N(" [") \o name \o N("]") \o SubSeq(stack, len + 1, Len(stack))
     ELSE stack
\* The stack that Node's inspect reads, but for its frames past the first, or Empty.
NodeErrorStack(s, v) ==
  LET o == O(s, v) IN
  IF "stack" \in DOMAIN o.slots THEN (IF IsString(o.slots.stack) THEN o.slots.stack.value ELSE Empty)
  ELSE IF "trace" \notin DOMAIN o.slots \/ "dropped" \in DOMAIN o.slots.trace THEN Empty ELSE
  LET t == o.slots.trace
      h == IF t.limit < 0 THEN ErrorBuiltin(s, Undefined, "toString", v, <<>>, Undefined) ELSE StackHeader(s, v, t)
  IN IF IsAbrupt(h) THEN Empty
     ELSE IF t.limit < 1 THEN Val(h).value
     ELSE Val(h).value \o (IF WalkFrames(h.s, [t EXCEPT !.limit = 1], t.callers, <<>>, [NoFrames EXCEPT !.isText = FALSE]).count = 1 THEN N("\n    at ") ELSE <<>>)
NodeErrorText(s, v) ==
  LET o == O(s, v)
      own == OrdinaryGetOwnProperty(o, SV("stack"))
  IN IF o.class # "error" \/ ProxyOnChain(s, v) \/ own = Absent \/ IsDataDescriptor(own)
        \/ ~SameValue(own.get, O(s, Intrinsic(s, "ErrorPrototype")).slots.stackGet) THEN Empty ELSE
  LET stack == NodeErrorStack(s, v)
      m == NodeDataGet(s, v, SV("message"))
      n == NodeDataGet(s, v, SV("name"))
      tagged == NodeDataGet(s, v, SymToStringTag)
      ownTag == OrdinaryGetOwnProperty(o, SymToStringTag)
  IN IF stack = Empty \/ stack = <<>> \/ m = Empty \/ n = Empty \/ tagged = Empty
        \/ ~(IsString(m) \/ m = Undefined) \/ ~(IsString(n) \/ n = Undefined) THEN Empty ELSE
  LET message == IF IsString(m) THEN m.value ELSE <<>>
      name == IF IsString(n) THEN n.value ELSE N("Error")
      tag == IF ~IsString(tagged) \/ (ownTag # Absent /\ ownTag.enumerable = True) THEN <<>> ELSE tagged.value
      keys == OwnKeysOf(o)
      isHidden(k) ==
        LET d == o.props[PropBucket(k)][k] IN
        /\ k \notin {SV("cause"), SV("errors"), SV("error"), SV("suppressed")}
        /\ (d.enumerable = False
            \/ k = SV("stack")
            \/ (k = SV("message") /\ (~IsString(m) \/ NodeIncludes(stack, message)))
            \/ (k = SV("name") /\ (~IsString(n) \/ NodeIncludes(stack, name))))
      constructor == NodeConstructorName(s, v, v)
  IN IF ~(\A i \in DOMAIN keys : isHidden(keys[i])) \/ constructor = Empty THEN Empty ELSE
  LET improved == NodeImproveStack(stack, constructor, name, tag)
      found == IF message = <<>> THEN -1 ELSE StringIndexOf(improved, message, 0)
      pos == IF found <= 0 THEN 0 ELSE found + Len(message)
      start == StringIndexOf(improved, N("\n    at"), pos)
  IN IF start = -1 THEN <<91>> \o improved \o <<93>> ELSE SubSeq(improved, 1, start)
\* Where Node says an error that a promise rejected with, or that an ES module threw, was made: the
\* first frame of its stack, in a line of a file's code that FileLines holds, or Empty.
NodeErrorSource(s, v) ==
  LET o == O(s, v) IN
  IF "trace" \notin DOMAIN o.slots \/ "dropped" \in DOMAIN o.slots.trace \/ o.slots.trace.limit < 1 THEN Empty ELSE
  LET w == WalkFrames(s, [o.slots.trace EXCEPT !.limit = 1], o.slots.trace.callers, <<>>, [NoFrames EXCEPT !.isText = FALSE]) IN
  IF w.count # 1 \/ w.positions[1] = <<>> \/ w.positions[1][1] \notin DOMAIN FileLines
     \/ FileLines[w.positions[1][1]] = Empty \/ w.positions[1][2] \notin DOMAIN FileLines[w.positions[1][1]]
     \/ FileLines[w.positions[1][1]][w.positions[1][2]] = Empty THEN Empty ELSE
  LET f == w.positions[1][1]
      n == w.positions[1][2]
      line == FileLines[f][n]
      pad == FilePads[f][n]
      column == w.positions[1][3]
  IN IF column > Len(line) + 1 THEN Empty
     ELSE FileUrls[f] \o <<58>> \o NumToString(NumFromInt(n)) \o <<10>> \o line \o <<10>>
          \o [i \in 1..(column - 1) |-> IF pad # Empty THEN pad[i] ELSE IF line[i] = 9 THEN 9 ELSE 32] \o <<94>>`;

// The steps of a script's spec as the CLI checks it on ESCore: where the script leaves an exception
// uncaught, Init fails with what Node prints, as getNodeExit reads it, for an error or a primitive
// that a throw statement of siteLocations throws, that the entry module's evaluation rejects with,
// or that another promise rejects with, which Node says it threw where the entry's code made an
// error, and Node's warning where the entry module's top-level await never settles,
// unsettledText, where it has one. It stops at a throw that Node says it threw in code that
// siteLocations leaves out, at an await it can't tell, and at an object whose text it can't tell.
const getEscoreScriptSteps = (files: readonly NodeFile[], unsettledText: string | undefined) => {
  const getUnits = (text: string) =>
    `<<${Array.from({ length: text.length }, (_, index) => text.charCodeAt(index)).join(", ")}>>`;
  // A line's units as its string's, where that's shorter than their tuple, as it is for most lines.
  const getLineUnits = (line: string) => {
    const units = getUnits(line);
    const patched = getPatchedUnits(line);
    return patched.length < units.length ? patched : units;
  };
  const getFunction = (pairs: string[]) =>
    pairs.length === 0 ? "[key \\in {} |-> Empty]" : pairs.join(" @@ ");
  const stop = getTlaString("tla-ts can't print what Node prints for this uncaught exception");
  // The characters that Node's text may hold: a tab, a line feed, the printable ASCII, and the
  // characters of the files' code, by code unit, or by the pair of surrogates of one past U+FFFF.
  const characters = [
    ...new Set([
      "\t",
      "\n",
      ...Array.from({ length: 95 }, (_, index) => String.fromCharCode(index + 32)),
      ...files.flatMap((file) => [...[...file.lines.values(), ...file.sites.values()].join("")]),
    ]),
  ].filter(isNodeText);
  // A line's padding, which has a tab where the line's UTF-8 has one, where a tab's place in its
  // UTF-8 isn't its place in its code units, or Empty.
  const getPad = (line: string) => {
    const bytes = Buffer.from(line, "utf8");
    const pad = Array.from({ length: line.length }, (_, position) =>
      bytes[position] === 9 ? 9 : 32,
    );
    return pad.some((unit, position) => (unit === 9) !== (line.charCodeAt(position) === 9))
      ? `<<${pad.join(", ")}>>`
      : "Empty";
  };
  // The files' texts by number, and each file's lines' by number, with Empty where a number names
  // no file of code or a line that FileLines leaves out, as sequences, which TLA+ reads without
  // nesting as deep as a file is long.
  const numbered = new Map(files.map((file) => [file.number, file]));
  const getByFile = (text: (file: NodeFile) => string) =>
    `<<${Array.from(
      { length: [...numbered.keys()].reduce((most, number) => Math.max(most, number), 0) },
      (_, index) => {
        const file = numbered.get(index + 1);
        return file === undefined ? "Empty" : text(file);
      },
    ).join(", ")}>>`;
  const getByLine = (file: NodeFile, text: (line: string) => string) =>
    `<<${Array.from(
      { length: [...file.lines.keys()].reduce((most, number) => Math.max(most, number), 0) },
      (_, index) => {
        const line = file.lines.get(index + 1);
        return line === undefined ? "Empty" : text(line);
      },
    ).join(", ")}>>`;
  return `VARIABLE programDone
ThrowSiteLocation(site) ==
  CASE ${files.flatMap((file) => [...file.sites].map(([index, text]) => `site = <<${file.number}, ${index}>> -> ${getTlaString(text)}\n    [] `)).join("")}OTHER -> Empty
FileUrls == ${getByFile((file) => getUnits(file.url))}
FileLines == ${getByFile((file) => getByLine(file, getLineUnits))}
FilePads == ${getByFile((file) => getByLine(file, getPad))}
UnitCharacters == ${getFunction(characters.filter((character) => character.length === 1).map((character) => `${character.charCodeAt(0)} :> ${getTlaString(character)}`))}
PairCharacters == ${getFunction(characters.filter((character) => character.length === 2).map((character) => `<<${character.charCodeAt(0)}, ${character.charCodeAt(1)}>> :> ${getTlaString(character)}`))}
RECURSIVE UnitsToText(_)
UnitsToText(units) ==
  IF units = <<>> THEN "" ELSE
  IF Len(units) > 1 /\\ <<units[1], units[2]>> \\in DOMAIN PairCharacters
  THEN PairCharacters[<<units[1], units[2]>>] \\o UnitsToText(SubSeq(units, 3, Len(units)))
  ELSE UnitCharacters[Head(units)] \\o UnitsToText(Tail(units))
RECURSIVE IsNodeText(_)
IsNodeText(units) ==
  \\/ units = <<>>
  \\/ Len(units) > 1 /\\ <<units[1], units[2]>> \\in DOMAIN PairCharacters /\\ IsNodeText(SubSeq(units, 3, Len(units)))
  \\/ Head(units) \\in DOMAIN UnitCharacters /\\ IsNodeText(Tail(units))
NodeText(units) == IF units # Empty /\\ IsNodeText(units) THEN UnitsToText(units) ELSE Empty
${foldNames(ERROR_TEXT)}
NodeUncaughtText(r) ==
  LET where == r.c.target
      v == r.c.value
      text == IF IsObject(v) \\/ IsSymbol(v) THEN Empty ELSE NodeText(PrimitiveToUnits(v))
      errorText == IF IsObject(v) THEN NodeText(NodeErrorText(r.s, v)) ELSE Empty
      source == IF IsObject(v) /\\ where # Empty /\\ where.kind \\in {"module", "rejection"} THEN NodeText(NodeErrorSource(r.s, v)) ELSE Empty
  IN CASE where # Empty /\\ where.kind = "unsettled" -> ${unsettledText === undefined ? stop : getTlaString(unsettledText)}
       [] where = Empty \\/ (IsObject(v) /\\ errorText = Empty) \\/ (~IsObject(v) /\\ text = Empty) -> ${stop}
       [] IsObject(v) /\\ where.kind \\in {"module", "rejection"} /\\ source # Empty -> source \\o "\\n\\n" \\o errorText
       [] IsObject(v) /\\ where.kind = "throw" /\\ ThrowSiteLocation(where.site) # Empty -> ThrowSiteLocation(where.site) \\o "\\n\\n" \\o errorText
       [] IsObject(v) -> ${stop}
       [] where.kind = "module" -> ${getTlaString(`\n${MODULE_UNCAUGHT_LOCATION}\n`)} \\o text \\o ${getTlaString(`\n${TRACE_UNCAUGHT_HINT}`)}
       [] where.kind = "rejection" ->
            ${getTlaString(`${UNHANDLED_REJECTION_LOCATION}\n\n${UNHANDLED_REJECTION_PREFIX}"`)} \\o text \\o ${getTlaString(`"${UNHANDLED_REJECTION_SUFFIX}`)}
       [] where.kind = "throw" /\\ ThrowSiteLocation(where.site) # Empty -> "\\n" \\o ThrowSiteLocation(where.site) \\o "\\n" \\o text \\o ${getTlaString(`\n${TRACE_UNCAUGHT_HINT}`)}
       [] OTHER -> ${stop}
Init ==
  LET r == ApplyTo(RunProgram, InitialState) IN
  /\\ IF r.c.type = "throw" THEN Assert(FALSE, NodeUncaughtText(r)) ELSE TRUE
  /\\ programDone = TRUE
Next == UNCHANGED programDone`;
};

// A TypeScript or JavaScript file compiled by specializing ESCore: a script with the steps above,
// and a model as compileModelToEscore compiles one. Node says where a script's throw statement
// threw by the file's URL, as it runs a TypeScript file, and an ES module's at its own code, but
// for a throw in a function, which a timer might have called.
const compileEscoreEntry = async (path: string, setBound?: number): Promise<CompiledInput> => {
  // The TypeScript compiler takes a while to load, so only a TypeScript or JavaScript input loads
  // it.
  const ts = (await import("@typescript/typescript6")).default;
  const { compileToEscore } = await import("../typescript/spec/compile");
  const { compileModelToEscore } = await import("../typescript/spec/model");
  const { isScript } = await import("../typescript/context");
  const { getModuleFormat } = await import("../typescript/spec/resolve");
  const { getJsxText } = await import("../typescript/program");
  const { stripTypes } = await import("../typescript/spec/strip-types");
  const runtime = await getEscoreRuntime();
  const source = readFileSync(path, "utf8");
  // The code that Node runs, whose lines it shows: the file's text, with its JSX the calls it
  // compiles to, and a TypeScript file's types stripped, which keeps every position.
  const text = getJsxText(path, source);
  const sourceFile = ts.createSourceFile(path, text, ts.ScriptTarget.ESNext, true);
  const code = /\.[cm]?tsx?$/.test(path)
    ? stripTypes(ts.createSourceFile(path, text, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TS))
    : text;
  const lines = code.split(/\r\n|[\n\r\u2028\u2029]/);
  // Node runs a file as an ES module or as CommonJS, as TypeScript and the file's syntax tell, and
  // names it by its URL, but a CommonJS file of JavaScript by its path.
  const isModule = getModuleFormat(path, text) === "module";
  const url =
    isModule || /\.[cm]?tsx?$/.test(path)
      ? pathToFileURL(realpathSync(path)).href
      : realpathSync(path);
  // Where Node says code is: the file's URL and the line, then the line, with a caret under the
  // node, whose padding has a tab where the line's UTF-8 has one (GetErrorSource of
  // src/node_errors.cc).
  const getLocationIn =
    (fileUrl: string, fileLines: readonly string[], file: SourceFile) => (node: Node) => {
      const start = file.getLineAndCharacterOfPosition(node.getStart());
      const bytes = Buffer.from(fileLines[start.line], "utf8");
      const padding = Array.from({ length: start.character }, (_, index) =>
        bytes[index] === 9 ? "\t" : " ",
      ).join("");
      const location = `${fileUrl}:${start.line + 1}\n${fileLines[start.line]}\n${padding}^`;
      return isNodeText(location) ? location : undefined;
    };
  const getLocation = getLocationIn(url, lines, sourceFile);
  // What Node shows of a file of the program, the entry first: its URL, the lines where it may say
  // an error was made, every line of the entry's and those of another file's that name an error,
  // and where each throw statement of a script or a CommonJS file threw, as Node says, where an ES
  // module's error was made instead.
  const getNodeFile = (file: ProgramFile, index: number): NodeFile[] => {
    const isEntry = index === 0;
    if (!isEntry && (file.kind === "json" || file.kind === "host" || !existsSync(file.path))) {
      return [];
    }
    const fileText = isEntry ? text : getJsxText(file.path, readFileSync(file.path, "utf8"));
    const fileCode = /\.[cm]?tsx?$/.test(file.path)
      ? stripTypes(
          ts.createSourceFile(file.path, fileText, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TS),
        )
      : fileText;
    const fileLines = isEntry ? lines : fileCode.split(/\r\n|[\n\r\u2028\u2029]/);
    const fileUrl = isEntry
      ? url
      : file.kind === "module" || /\.[cm]?tsx?$/.test(file.path)
        ? pathToFileURL(realpathSync(file.path)).href
        : realpathSync(file.path);
    const parsed = isEntry
      ? sourceFile
      : ts.createSourceFile(file.path, fileText, ts.ScriptTarget.ESNext, true);
    const throws: ThrowStatement[] = [];
    const collect = (node: Node): void => {
      if (ts.isThrowStatement(node)) throws.push(node);
      ts.forEachChild(node, collect);
    };
    collect(parsed);
    const getFileLocation = getLocationIn(fileUrl, fileLines, parsed);
    return [
      {
        number: index + 1,
        url: fileUrl,
        lines: new Map(
          fileLines.flatMap((line, position) =>
            isEntry || line.includes("Error") ? [[position + 1, line] as const] : [],
          ),
        ),
        sites: new Map(
          (isEntry ? isModule : file.kind === "module")
            ? []
            : throws.flatMap((statement, position) => {
                const location = getFileLocation(statement);
                return location === undefined ? [] : [[position + 1, location] as const];
              }),
        ),
      },
    ];
  };
  // Node says where the entry module awaits once nothing is left to run, which tla-ts tells where
  // its top level awaits at one place.
  const awaits: Node[] = [];
  const collectAwaits = (node: Node): void => {
    if (ts.isFunctionLike(node)) return;
    if (
      ts.isAwaitExpression(node) ||
      (ts.isForOfStatement(node) && node.awaitModifier !== undefined) ||
      (ts.isVariableDeclarationList(node) &&
        (node.flags & ts.NodeFlags.AwaitUsing) === ts.NodeFlags.AwaitUsing)
    ) {
      awaits.push(node);
    }
    ts.forEachChild(node, collectAwaits);
  };
  collectAwaits(sourceFile);
  const awaited = awaits.length === 1 ? getLocation(awaits[0]) : undefined;
  const unsettledText = awaited === undefined ? undefined : `${UNSETTLED_AWAIT_WARNING}${awaited}`;
  // A module whose exported functions the model calls none of runs as a script.
  const model = isScript(sourceFile)
    ? undefined
    : compileModelToEscore(source, path, runtime, undefined, true, setBound);
  const isScriptFile = model === undefined || model.isScript;
  const spec =
    model !== undefined && !model.isScript
      ? model
      : compileToEscore(source, path, runtime, true, {
          steps: (files) => getEscoreScriptSteps(files.flatMap(getNodeFile), unsettledText),
          entries: [],
        });
  return {
    path,
    specPath: join(dirname(path), `${spec.name}.tla`),
    source: parseModule(spec.source),
    config: spec.config,
    loadModule: spec.loadModule,
    preparedModules: spec.preparedModules,
    isScript: isScriptFile,
    notes: model?.notes ?? [],
    frame: model?.isScript === false ? model.frame : undefined,
  };
};

// Where Node's type stripping rejects the syntax of a file that it loads as CommonJS, the spec of a
// program that fails as Node does, with Node's SyntaxError: where the file's code is, with the
// line before and the line after, a caret under each character of the syntax, and the error's
// code. A file that Node loads as an ES module fails in Node's own code, whose place in Node's
// text tla-ts can't tell, and the error stops there, as does one at syntax across lines.
const compileRejection = async (path: string, error: TlaStrippingError) => {
  const ts = (await import("@typescript/typescript6")).default;
  const { compileToEscore } = await import("../typescript/spec/compile");
  const text = readFileSync(path, "utf8");
  const sourceFile = ts.createSourceFile(path, text, ts.ScriptTarget.ESNext, true);
  const start = sourceFile.getLineAndCharacterOfPosition(error.start);
  const end = sourceFile.getLineAndCharacterOfPosition(error.end);
  const lines = text.split(/\r\n|[\n\r\u2028\u2029]/);
  const isModule =
    ts.getImpliedNodeFormatForFile(path, undefined, ts.sys, {
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
    }) === ts.ModuleKind.ESNext;
  const shown = [
    ...(start.line > 0 ? [lines[start.line - 1]] : []),
    lines[start.line],
    `${lines[start.line].slice(0, start.character).replace(/[^\t]/g, " ")}${"^".repeat(end.character - start.character)}`,
    ...(start.line + 2 < lines.length || (lines[start.line + 1] ?? "") !== ""
      ? [lines[start.line + 1]]
      : []),
  ];
  const message = `${pathToFileURL(realpathSync(path)).href}:${start.line + 1}\n${shown.join("\n")}\n\nSyntaxError [${error.code}]: ${error.reason} {\n  code: '${error.code}'\n}`;
  if (
    isModule ||
    realpathSync(error.fileName) !== realpathSync(path) ||
    start.line !== end.line ||
    !isNodeText(message)
  ) {
    throw error;
  }
  const spec = compileToEscore("", path, await getEscoreRuntime(), false, {
    steps: `VARIABLE programDone\nInit == Assert(FALSE, ${getTlaString(message)}) /\\ programDone = TRUE\nNext == UNCHANGED programDone`,
    entries: [],
  });
  return {
    path,
    specPath: join(dirname(path), `${spec.name}.tla`),
    source: parseModule(spec.source),
    config: spec.config,
    loadModule: spec.loadModule,
    preparedModules: spec.preparedModules,
    isScript: true,
    isPrepared: true,
    notes: [],
  };
};

// A TypeScript or JavaScript file compiled by specializing ESCore (see compileEscoreEntry), or,
// where Node's type stripping rejects it, a program that fails as Node does.
export const compileTypeScriptFile = (path: string, setBound?: number): Promise<CompiledInput> =>
  compileEscoreEntry(path, setBound).catch((error: unknown) =>
    error instanceof TlaStrippingError ? compileRejection(path, error) : Promise.reject(error),
  );

// The definitions of a program shared by several files' models: what its entry's run leaves, which
// each model starts from, and whether the run threw.
const SHARED_STEPS = `SharedRun == ApplyTo(RunProgram, InitialState)
SharedThrew == SharedRun.c.type = "throw"`;

// The start of each file's own module in a shared program, which a group's base links in its place
// so that its strings rank as the files' do.
const OWN_MODULE_HEADER = `---- MODULE ProgramModel ----
EXTENDS ProgramCode, ESCanonical
CONSTANTS TsNull, TsUndefined
`;

// The steps of a file of a shared program whose functions its model calls none of, which hold
// where the program runs without a throw, as a script's do.
const SHARED_SCRIPT = `${OWN_MODULE_HEADER}VARIABLE programDone
Init == ~SharedThrew /\\ programDone = TRUE
Next == UNCHANGED programDone
====
`;

// The settings of a run that each file's check of a shared program has alike, which its group's
// base starts with.
export interface SharedSettings {
  maxSetSize: number | undefined;
  seed: bigint | undefined;
  fingerprintPolynomial: number | undefined;
  version: TlcVersion;
}

// A file's spec of a shared program, as texts: its root, which extends its own module after the
// shared ones, its config, and its own module.
interface SharedFile {
  path: string;
  specPath: string;
  source: string;
  config: string;
  ownModule: string | undefined;
  isScript: boolean;
  notes: string[];
  frame?: string;
}

// A group's shared program as the run compiles it, in texts alone, which the group's worker starts
// and checks: the program's code, the text and leaves of the runtime's view that the code extends,
// which the worker makes again, and each file's spec, or undefined for a file that compiles alone,
// with the lines that the compile shows. A program above the budget gives its size alone, and a
// group whose files all compile alone gives the lines that the compile shows.
export type SharedProgram =
  | { kind: "alone"; shown: string[] }
  | { kind: "oversize"; characters: number }
  | {
      kind: "compiled";
      characters: number;
      config: string;
      code: string;
      view: { text: string; leaves: readonly string[] };
      files: (SharedFile | undefined)[];
      shown: string[];
    };

// The loader of the modules of a file's spec of a shared program, which holds their texts alone, so
// that a check keeps nothing of the compile.
const getSharedLoader =
  (ownModule: string | undefined, programText: string, canonical: string) => (name: string) =>
    name === "ProgramModel"
      ? ownModule
      : name === "ProgramCode"
        ? programText
        : name === "ESCanonical"
          ? canonical
          : undefined;

// The program that a group's TypeScript files share, compiled where the run parses each file's
// TypeScript once for every group: an entry that imports the files in their order, and each file's
// model, which starts from the state that the entry's run leaves, with its own checks, frame and
// trace. A file without a model that can start there has none, and compiles alone, as every file
// does where the program stops.
export const compileSharedProgram = async (
  paths: readonly string[],
  setBound: number | undefined,
  budget: number,
): Promise<SharedProgram> => {
  const ts = (await import("@typescript/typescript6")).default;
  const { compileToEscore } = await import("../typescript/spec/compile");
  const { getModelConstants, planModel, SHARED_MODEL_DEFINITIONS } =
    await import("../typescript/spec/model");
  const { isScript } = await import("../typescript/context");
  const { getJsxText } = await import("../typescript/program");
  const { getModuleFormat } = await import("../typescript/spec/resolve");
  const runtime = await getEscoreRuntime();
  const plans = paths.map((path) => {
    const source = readFileSync(path, "utf8");
    const text = getJsxText(path, source);
    const sourceFile = ts.createSourceFile(path, text, ts.ScriptTarget.ESNext, true);
    if (isScript(sourceFile)) return undefined;
    // A file whose model stops compiles alone, which reports the stop as the file's.
    try {
      const plan = planModel(source, path, runtime, undefined, true, setBound);
      // An ES module whose functions the model calls none of checks that the program runs.
      if (plan.isScript) return getModuleFormat(path, text) === "module" ? plan : undefined;
      return plan.isShareable ? plan : undefined;
    } catch {
      return undefined;
    }
  });
  const members = paths.filter((_path, index) => plans[index] !== undefined);
  if (members.length < 2) return { kind: "alone", shown: [] };
  const models = plans.flatMap((plan) => (plan === undefined || plan.isScript ? [] : [plan]));
  const numbered: string[] = [];
  // The text and leaves of the runtime's view that the code extends, from which the group's worker
  // makes the view again.
  const views: { text: string; leaves: readonly string[] }[] = [];
  try {
    const spec = compileToEscore(
      members.map((path) => `import ${JSON.stringify(realpathSync(path))};`).join("\n"),
      join(dirname(realpathSync(members[0])), "tla-ts-shared.mjs"),
      {
        ...runtime,
        getView: (text, leaves) => {
          views.push({ text, leaves });
          return runtime.getView(text, leaves);
        },
      },
      true,
      {
        steps: (files) => {
          numbered.push(...files.map((file) => file.path));
          return `${SHARED_STEPS}\n${SHARED_MODEL_DEFINITIONS}`;
        },
        entries: [...new Set(models.flatMap((plan) => [...plan.entries]))],
        reads: models.flatMap((plan) => [plan.reads, plan.getSteps(1)]).join("\n"),
      },
    );
    const code = spec.loadModule("ProgramCode") ?? "";
    if (code.length > budget) return { kind: "oversize", characters: code.length };
    const shown: string[] = [];
    const files = paths.map((path, index): SharedFile | undefined => {
      const plan = plans[index];
      if (plan === undefined) return undefined;
      if (plan.isScript) {
        return {
          path,
          specPath: join(dirname(path), `${spec.name}.tla`),
          source: spec.source.replace(
            ", ProgramCode\n",
            ", ProgramCode, ESCanonical, ProgramModel\n",
          ),
          config: [...getModelConstants(spec.config), "INIT Init", "NEXT Next", ""].join("\n"),
          ownModule: SHARED_SCRIPT,
          isScript: true,
          notes: plan.notes,
        };
      }
      const target = realpathSync(path);
      const file = numbered.findIndex(
        (other) => existsSync(other) && realpathSync(other) === target,
      );
      // The file's model holds the definitions its group's program holds in place of each one's.
      if (!plan.getSteps(file + 1).includes(SHARED_MODEL_DEFINITIONS)) {
        shown.push(
          `tla-ts checks ${basename(path)} alone [model-definitions]: its model defines CallBuiltin's substitute other than its group's program does`,
        );
        return undefined;
      }
      const model = plan.finish(spec, file + 1);
      return {
        path,
        specPath: join(dirname(path), `${model.name}.tla`),
        source: model.source,
        config: model.config,
        ownModule: model.loadModule("ProgramModel"),
        isScript: false,
        notes: model.notes,
        frame: model.frame,
      };
    });
    return {
      kind: "compiled",
      characters: code.length,
      config: spec.config,
      code,
      view: views[0],
      files,
      shown,
    };
  } catch (error) {
    if (!(error instanceof TlaError)) throw error;
    return {
      kind: "alone",
      shown: [`tla-ts checks each file alone [program-stops]: ${error.message}`],
    };
  }
};

// The specs of the files of a group's shared program, which the group's worker starts: the
// program's code, checked by SANY's checks and prepared, and the group's base, its modules that
// every file's spec extends linked, started and run once, which each file's check starts from
// where it ranks their strings and reads their definitions as the base did, and otherwise checks
// alone. A file without a spec, or every file where the program stops or its run throws, compiles
// alone.
export const compileSharedFiles = async (
  program: Exclude<SharedProgram, { kind: "oversize" }>,
  settings: SharedSettings,
): Promise<(CompiledInput | undefined)[]> => {
  const { prepareProgram } = await import("../typescript/spec/prepare");
  const { CANONICAL_MODULE } = await import("../typescript/spec/canonical");
  const { createCheckBase } = await import("../search");
  const { createTlcOrder } = await import("../tlc/order");
  if (program.kind === "alone") {
    program.shown.forEach((line) => console.log(line));
    return [];
  }
  const runtime = await getEscoreRuntime();
  const getConstants = (config: string) =>
    config.split("\n").filter((line) => line.startsWith("CONSTANT"));
  // The group's base, from which each file's check starts, and the strings it ranked.
  const getBase = (sample: CompiledInput) => {
    const config = parseConfig([...getConstants(sample.config), ""].join("\n"));
    const base = (() => {
      try {
        return createCheckBase(
          config,
          {
            // A check of a parsed root with prepared values reads it as its printed text.
            source: printModule(sample.source),
            loadModule: (name) =>
              name === "ProgramModel" ? `${OWN_MODULE_HEADER}====\n` : sample.loadModule(name),
            preparedModules: sample.preparedModules,
            ...settings,
          },
          "ProgramModel",
        );
      } catch (error) {
        if (!(error instanceof TlaSharedBaseError)) throw error;
        console.log(`tla-ts checks each file alone [${error.code}]: ${error.message}`);
        return undefined;
      }
    })();
    if (base === undefined) return undefined;
    const threw = base.environment.link.definitions.get(`SharedThrew${KEY_SEPARATOR}ProgramCode`);
    const id = threw === undefined ? undefined : base.environment.facts.ids.get(threw);
    if (id === undefined || base.environment.startupValues[id] !== false) {
      throw new TlaSharedBaseError("program-throws", "their shared program throws as it loads");
    }
    return base;
  };
  // The strings of a file's spec in the order its check ranks them: its own, then the group's.
  const getRanked = (input: CompiledInput, base: CheckBase) => {
    const ranked = new Map<string, number>();
    [
      ...createTlcOrder(
        printModule(input.source),
        input.loadModule,
        input.preparedModules,
      ).getStringOrder(parseConfig(input.config), [], []),
      ...base.strings,
    ].forEach((text) => {
      if (!ranked.has(text)) ranked.set(text, ranked.size);
    });
    return ranked;
  };
  // Why a file's check can't start from its group's base, as a code and a reason, or undefined
  // where it can.
  const getAloneReason = (
    input: CompiledInput,
    base: CheckBase,
    constants: string[],
    ranked: ReadonlyMap<string, number>,
  ) => {
    if (getConstants(input.config).join("\n") !== constants.join("\n")) {
      return ["config", "its config's CONSTANT lines differ from the group's"];
    }
    const strings = new Set(base.strings);
    // The strings that the base's values hold keep the order the base gave them.
    const order = [...ranked.keys()].filter((text) => base.valueStrings.has(text));
    const baseOrder = base.strings.filter((text) => base.valueStrings.has(text));
    if (order.some((text, index) => text !== baseOrder[index])) {
      return ["strings", "its strings rank those of its group's values in another order"];
    }
    const valueNames = parseConfig(input.config).constants.flatMap((constant) =>
      constant.value.kind === "ModelValue" ? [constant.value.name] : [],
    );
    if (
      valueNames.some(
        (name) => strings.has(name) && ranked.get(name) !== base.strings.indexOf(name),
      )
    ) {
      return ["model-values", "its model values rank other than the group's"];
    }
    return undefined;
  };
  try {
    const shared = [...runtime.modules, runtime.getView(program.view.text, program.view.leaves)];
    const loadProgram = (name: string) => (name === "ProgramCode" ? program.code : undefined);
    const preparedModules = [
      ...shared,
      prepareProgram({ config: program.config, loadModule: loadProgram, preparedModules: shared }),
      ...["ESCanonical"].flatMap((name) => runtime.getExtension(name) ?? []),
    ];
    program.shown.forEach((line) => console.log(line));
    const inputs = program.files.map((file): CompiledInput | undefined =>
      file === undefined
        ? undefined
        : {
            path: file.path,
            specPath: file.specPath,
            source: parseModule(file.source),
            config: file.config,
            loadModule: getSharedLoader(file.ownModule, program.code, CANONICAL_MODULE),
            preparedModules,
            isScript: file.isScript,
            notes: file.notes,
            frame: file.frame,
          },
    );
    const sample = inputs.find((input) => input !== undefined);
    if (sample === undefined) return inputs;
    const base = getBase(sample);
    if (base === undefined) return inputs;
    const constants = getConstants(sample.config);
    return inputs.map((input) => {
      if (input === undefined) return undefined;
      const ranked = getRanked(input, base);
      const reason = getAloneReason(input, base, constants, ranked);
      if (reason === undefined) return { ...input, base, strings: [...ranked.keys()] };
      console.log(`tla-ts checks ${basename(input.path)} alone [${reason[0]}]: ${reason[1]}`);
      return input;
    });
  } catch (error) {
    if (!(error instanceof TlaError)) throw error;
    const code = error instanceof TlaSharedBaseError ? error.code : "program-stops";
    console.log(`tla-ts checks each file alone [${code}]: ${error.message}`);
    return [];
  }
};
