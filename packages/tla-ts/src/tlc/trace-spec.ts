import { getJavaHashCode } from "../java-hash";
import { formatValue, type Value } from "../values";
import { zeroPad } from "./messages";

interface TraceSpecInput {
  module: string;
  specName: string;
  rawConstants: string[];
  states: Record<string, Value>[];
  loopStart: number | undefined;
  modelValues: string[];
  isDefined: (name: string) => boolean;
}

const INDENT = "    ";
const SEPARATOR = "\n----\n";
const CLOSING_TAG = `${"=".repeat(77)}\n`;
const LASSO_START = "_TTraceLassoStart";
const LASSO_END = "_TTraceLassoEnd";

const getHashMapHash = (text: string) => {
  const hash = getJavaHashCode(text);
  return hash ^ (hash >>> 16);
};

const getHashOrder = (names: string[]) => {
  const unique = [...new Set(names)];
  const capacity = 2 ** Math.max(4, Math.ceil(Math.log2(unique.length / 0.75)));
  return unique
    .map((name, index) => ({ name, index, bucket: getHashMapHash(name) & (capacity - 1) }))
    .sort((left, right) => left.bucket - right.bucket || left.index - right.index)
    .map((entry) => entry.name);
};

const formatJavaDate = (date: Date) => {
  const getPart = (options: Intl.DateTimeFormatOptions, type: Intl.DateTimeFormatPartTypes) =>
    new Intl.DateTimeFormat("en-US", options).formatToParts(date).find((part) => part.type === type)
      ?.value;
  return `${getPart({ weekday: "short" }, "weekday")} ${getPart({ month: "short" }, "month")} ${zeroPad(date.getDate())} ${zeroPad(date.getHours())}:${zeroPad(date.getMinutes())}:${zeroPad(date.getSeconds())} ${getPart({ timeZoneName: "short" }, "timeZoneName")} ${date.getFullYear()}`;
};

const splitLines = (text: string) => {
  const lines = text.split("\n");
  while (lines.length > 1 && lines[lines.length - 1] === "") lines.pop();
  return lines;
};

const indent = (text: string, depth: number) => {
  const prefix = INDENT.repeat(depth);
  return prefix + splitLines(text).join(`\n${prefix}`);
};

const getPrimer = (module: string, extendedModules: string[]) =>
  `---- MODULE ${module} ----\nEXTENDS ${extendedModules.join(", ")}\n\n`;

const getConjunction = (state: [string, string][], prefix?: string) =>
  indent(
    [
      ...(prefix === undefined ? [] : [prefix]),
      ...state.map(([name, value]) => `${name} = (${value})`),
    ].join("\n/\\\n"),
    2,
  );

const getInstance = (name: string, module: string, definition: string) =>
  `${name} ==\n${INDENT}LET ${module} == INSTANCE ${module}\n${INDENT}IN ${module}!${definition}\n----\n`;

const getExpressionStub = (specName: string, variables: string[]) => {
  const variable = variables[0];
  const examples =
    variable === undefined
      ? ""
      : `\\* ,_${variable}Unchanged |-> ${variable} = ${variable}'

\\* Format the \`${variable}\` variable as Json value.
\\* ,_${variable}Json |->
\\*     LET J == INSTANCE Json
\\*     IN J!ToJson(${variable})

\\* Lastly, you may build expressions over arbitrary sets of states by
\\* leveraging the _TETrace operator.  For example, this is how to
\\* count the number of times a spec variable changed up to the current
\\* state in the trace.
\\* ,_${variable}ModCount |->
\\*     LET F[s \\in DOMAIN _TETrace] ==
\\*         IF s = 1 THEN 0
\\*         ELSE IF _TETrace[s].${variable} # _TETrace[s-1].${variable}
\\*             THEN 1 + F[s-1] ELSE F[s-1]
\\*     IN F[_TEPosition - 1]
`;
  const body = `\\* To hide variables of the \`${specName}\` spec from the error trace,
\\* remove the variables below.  The trace will be written in the order
\\* of the fields of this record.
${variables.map((name) => `${name} |-> ${name}`).join("\n,")}

\\* Put additional constant-, state-, and action-level expressions here:
\\* ,_stateNumber |-> _TEPosition
${examples}`;
  return `expression == \n${INDENT}[\n${indent(body, 2)}\n${INDENT}]\n\n`;
};

export const writeTraceSpec = (input: TraceSpecInput) => {
  const loopStart = input.loopStart;
  const states = input.states.map((state) =>
    getHashOrder(Object.keys(state)).map((name): [string, string] => [
      name,
      formatValue(state[name]),
    ]),
  );
  if (states.length + (loopStart === undefined ? 0 : 1) <= 1) return undefined;
  const variables = Object.keys(input.states[0]);
  const specName = input.specName;
  const final = states[states.length - 1];
  const isStuttering = loopStart === states.length - 1;
  const isLasso = loopStart !== undefined && !isStuttering;

  const declaredNames = new Set(input.rawConstants.map((line) => line.split(" = ")[0]));
  const constantLines = [
    ...input.rawConstants.map((line) => indent(line, 1)),
    ...input.modelValues
      .filter((name) => !declaredNames.has(name))
      .map((name) => indent(`${name} = ${name}`, 1)),
    ...(isLasso ? [`${LASSO_START} = ${loopStart + 1}`, `${LASSO_END} = ${states.length}`] : []),
  ];
  const teConstants = [
    ...input.modelValues.filter((name) => !input.isDefined(name)),
    ...(isLasso ? [LASSO_START, LASSO_END] : []),
  ];
  const teConstantsModule = `${specName}_TEConstants`;
  const constantModules = getHashOrder([
    "TLC",
    ...(teConstants.length > 0 ? [teConstantsModule] : []),
  ]);
  const extendedModules = getHashOrder([
    "Toolbox",
    "TLCExt",
    "Naturals",
    "Sequences",
    ...constantModules,
    specName,
  ]);
  const expressionModule = `${specName}_TEExpression`;
  const traceModule = `${specName}_TETrace`;

  const property = isStuttering
    ? {
        config: "\nPROPERTY\n    _prop\n",
        definition: `\n_prop ==\n${INDENT}~<>[](\n${getConjunction(final)}\n${INDENT})`,
      }
    : isLasso
      ? {
          config: "\nPROPERTY\n    _prop\n",
          definition: `\n_prop ==\n${indent(
            `~(([]<>(\n${getConjunction(final)}\n))/\\([]<>(\n${getConjunction(states[loopStart])}\n)))`,
            1,
          )}`,
        }
      : {
          config: "\nINVARIANT\n    _inv\n",
          definition: `\n_inv ==\n${INDENT}~(\n${getConjunction(final, 'TLCGet("level") = Len(_TETrace)')}\n${INDENT})`,
        };
  const lassoStep = isLasso
    ? `${INDENT}${INDENT}   \\/ /\\ i = ${LASSO_END}\n${INDENT}${INDENT}      /\\ j = ${LASSO_START}\n`
    : "";
  const next = `_next ==
    /\\ \\E i,j \\in DOMAIN _TETrace:
        /\\ \\/ /\\ j = i + 1
              /\\ i = TLCGet("level")
${lassoStep}${variables
    .map(
      (name) =>
        `        /\\ ${name}  = _TETrace[i].${name}\n        /\\ ${name}' = _TETrace[j].${name}\n`,
    )
    .join("")}
\\* Uncomment the ASSUME below to write the states of the error trace
\\* to the given file in Json format. Note that you can pass any tuple
\\* to \`JsonSerialize\`. For example, a sub-sequence of _TETrace.
    \\* ASSUME
    \\*     LET J == INSTANCE Json
    \\*         IN J!JsonSerialize("${input.module}.json", _TETrace)

`;
  const isViewed =
    isLasso && new Set(states.map((state) => JSON.stringify(state))).size < states.length;
  const view = isViewed
    ? {
        config: "\nVIEW\n    _view\n",
        definition: `\n_view ==\n${INDENT}<<${variables.join(", ")}, IF TLCGet("level") = ${LASSO_END} + 1 THEN ${LASSO_START} ELSE TLCGet("level")>>\n`,
      }
    : { config: "", definition: "" };
  const deserializedTrace = `\n${getPrimer(traceModule, getHashOrder(["IOUtils", ...constantModules, specName]))}trace == IODeserialize("${input.module}.bin", TRUE)\n\n${CLOSING_TAG}`;
  const traceFunction = `${INDENT}<<\n${states
    .map(
      (state) => `${INDENT}([${state.map(([name, value]) => `${name} |-> ${value}`).join(",")}])`,
    )
    .join(",\n")}\n${INDENT}>>${SEPARATOR}\n`;

  const tla = [
    getPrimer(input.module, extendedModules),
    `${getInstance("_expression", expressionModule, "expression")}\n`,
    getInstance("_trace", traceModule, "trace"),
    property.definition,
    `${SEPARATOR}\n`,
    "_init ==\n",
    variables.map((name) => `${INDENT}/\\ ${name} = _TETrace[1].${name}\n`).join(""),
    "----\n\n",
    next,
    view.definition,
    CLOSING_TAG,
    "\n",
    ` Note that you can extract this module \`${expressionModule}\`\n`,
    "  to a dedicated file to reuse `expression` (the module in the \n",
    `  dedicated \`${expressionModule}.tla\` file takes precedence \n`,
    `  over the module \`${expressionModule}\` below).`,
    `\n\n${getPrimer(expressionModule, extendedModules)}${getExpressionStub(specName, variables)}${CLOSING_TAG}\n\n`,
    "\n",
    "Parsing and semantic processing can take forever if the trace below is long.\n",
    " In this case, it is advised to uncomment the module below to deserialize the\n",
    " trace from a generated binary file.\n",
    `\n\\*${deserializedTrace.replaceAll("\n", "\n\\*")}\n\n`,
    getPrimer(traceModule, getHashOrder([...constantModules, specName])),
    `trace == \n${traceFunction}\n`,
    ...(teConstants.length > 0
      ? [
          CLOSING_TAG,
          "\n",
          getPrimer(teConstantsModule, [specName]),
          `CONSTANTS ${teConstants.join(", ")}\n\n`,
        ]
      : []),
    CLOSING_TAG,
  ].join("");
  const config = [
    `\n---- CONFIG ${input.module} ----\n`,
    constantLines.length > 0
      ? `CONSTANTS\n${constantLines.map((line) => `${line}\n`).join("")}`
      : "",
    property.config,
    "\nCHECK_DEADLOCK\n    \\* CHECK_DEADLOCK off because of PROPERTY or INVARIANT above.\n    FALSE",
    "\n\nINIT\n    _init\n",
    "\nNEXT\n    _next\n",
    view.config,
    "\nCONSTANT\n    _TETrace <- _trace\n",
    "\nALIAS\n    _expression\n",
    CLOSING_TAG,
    `\\* Generated on ${formatJavaDate(new Date())}`,
  ].join("");
  return tla + config;
};
