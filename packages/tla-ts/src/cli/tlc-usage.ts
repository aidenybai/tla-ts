// A port of TLC.printUsage and UsageGenerator.displayUsage.
interface UsageArgument {
  name: string;
  sampleValue?: string;
  description?: string;
  isOptional: boolean;
  subOptions?: string;
}

const SHARED_ARGUMENTS: UsageArgument[] = [
  {
    name: "-checkpoint",
    sampleValue: "minutes",
    description: "interval between check point; defaults to 30",
    isOptional: true,
  },
  { name: "-cleanup", description: "clean up the states directory", isOptional: true },
  {
    name: "-config",
    sampleValue: "file",
    description: "provide the configuration file; defaults to SPEC.cfg",
    isOptional: true,
  },
  {
    name: "-continue",
    description:
      "continue running even when an invariant is violated; default\nbehavior is to halt on first violation",
    isOptional: true,
  },
  {
    name: "-coverage",
    sampleValue: "minutes",
    description:
      "interval between the collection of coverage information;\nif not specified, no coverage will be collected",
    isOptional: true,
  },
  {
    name: "-deadlock",
    description:
      "if specified DO NOT CHECK FOR DEADLOCK. Setting the flag is\nthe same as setting CHECK_DEADLOCK to FALSE in config\nfile. When -deadlock is specified, config entry is\nignored; default behavior is to check for deadlocks",
    isOptional: true,
  },
  {
    name: "-postCondition",
    sampleValue: "mod!oper",
    description:
      "evaluate the given (constant-level) operator oper in the TLA+\nmodule mod at the end of model-checking.",
    isOptional: true,
  },
  {
    name: "-difftrace",
    description:
      "show only the differences between successive states when\nprinting trace information; defaults to printing\nfull state descriptions",
    isOptional: true,
  },
  {
    name: "-dumpTrace",
    sampleValue: "format file",
    description:
      'in case of a property violation, formats the TLA+ error trace\nas the given format and dumps the output to the specified\nfile.  The file is relative to the same directory as the\nmain spec. At the time of writing, TLC supports the "tla"\nand the "json" formats.  To dump to multiple formats, the\n-dumpTrace parameter may appear multiple times.\nThe git commits 1eb815620 and 386eaa19f show that adding new\nformats is easy.\n',
    isOptional: true,
  },
  {
    name: "-inv",
    sampleValue: "expr",
    description: "evaluate the given (state-level) TLA+ formula expr as an invariant",
    isOptional: true,
  },
  {
    name: "-invlevel",
    sampleValue: "n",
    description:
      'with n \\in Nat, evaluate the invariant TLCGet("level") < n,\nwhere TLCGet("level") represents the distance of the current\nstate to some initial state. In other words, TLC will print the\nfirst trace it encounters with length n. After that, TLC will\nstop, unless the \'-continue\' parameter is specified.',
    isOptional: true,
  },
  {
    name: "-debug",
    description: "print various debugging information - not for production use\n",
    isOptional: true,
  },
  {
    name: "-dump",
    sampleValue: "format file",
    description:
      "dump all states into the specified file.\nThe format parameter can be omitted, or it can be a comma-separated\nlist beginning with 'dot' that may also contain a subset of\nthe items 'colorize', 'actionlabels', and 'constrained'. If format is\nomitted, TLC writes a list of all reachable states, described by TLA+\nformulas, on file. Otherwise, TLC writes the state graph in dot format,\nthe input format of the GraphViz program for displaying graphs. \nThe parameter 'colorize' indicates that state transitions should be \ncolored according to the action generating the transition,  \nand 'actionlabels' indicates that they should be labeled with \nthe name of the action. The parameter 'constrained' causes TLC to include\nstates in the dot file that are excluded from the model via a state or\naction constraint.",
    isOptional: true,
  },
  {
    name: "-fp",
    sampleValue: "N",
    description: "use the Nth irreducible polynomial from the list stored\nin the class FP64",
    isOptional: true,
  },
  {
    name: "-fpbits",
    sampleValue: "num",
    description: "the number of MSB used by MultiFPSet to create nested\nFPSets; defaults to 1",
    isOptional: true,
  },
  {
    name: "-fpmem",
    sampleValue: "num",
    description:
      "a value in (0.0,1.0) representing the ratio of total\nphysical memory to devote to storing the fingerprints\nof found states; defaults to 0.25",
    isOptional: true,
  },
  {
    name: "-noGenerateSpecTE",
    description:
      "Whether to skip generating a trace exploration (TE) spec in\nthe event of TLC finding a state or behavior that does\nnot satisfy the invariants; TLC's default behavior is to\ngenerate this spec.",
    isOptional: true,
  },
  {
    name: "-teSpecOutDir",
    sampleValue: "some-dir-name",
    description:
      "Directory to which to output the TE spec if TLC generates\nan error trace. Can be a relative (to root spec dir)\nor absolute path. By default the TE spec is output\nto the same directory as the main spec.",
    isOptional: true,
  },
  {
    name: "-gzip",
    description: "control if gzip is applied to value input/output streams;\ndefaults to 'off'",
    isOptional: true,
  },
  { name: "-h", description: "display these help instructions", isOptional: true },
  {
    name: "-loadTrace",
    sampleValue: "format file",
    description:
      'load a trace from the specified file in the given format\nto use as a constraint. The file is relative to the same\ndirectory as the main spec. At the time of writing, TLC\nsupports the "tlc" and the "json" formats.\nNote: -loadTrace is not supported in simulation mode.\n',
    isOptional: true,
  },
  {
    name: "-maxSetSize",
    sampleValue: "num",
    description:
      "the size of the largest set which TLC will enumerate; defaults\nto 1000000 (10^6)",
    isOptional: true,
  },
  {
    name: "-metadir",
    sampleValue: "path",
    description:
      "specify the directory in which to store metadata; defaults to\nSPEC-directory/states if not specified",
    isOptional: true,
  },
  {
    name: "-nowarning",
    description: "disable all warnings; defaults to reporting warnings",
    isOptional: true,
  },
  {
    name: "-suppressMessages",
    sampleValue: "codes",
    description:
      "suppress specific messages; comma-separated list of\nmessage codes; cannot be combined with -nowarning\nSANY message codes can be found in https://github.com/tlaplus/tlaplus/blob/master/tlatools/org.lamport.tlatools/src/tla2sany/semantic/ErrorCode.java#L38\nTLC message codes can be found in https://github.com/tlaplus/tlaplus/blob/master/tlatools/org.lamport.tlatools/src/tlc2/output/EC.java#L19",
    isOptional: true,
  },
  {
    name: "-messagesAsErrors",
    sampleValue: "codes",
    description:
      "treat specific messages as errors; comma-separated list of\nmessage codes\nSANY message codes can be found in https://github.com/tlaplus/tlaplus/blob/master/tlatools/org.lamport.tlatools/src/tla2sany/semantic/ErrorCode.java#L38\nTLC message codes can be found in https://github.com/tlaplus/tlaplus/blob/master/tlatools/org.lamport.tlatools/src/tlc2/output/EC.java#L19",
    isOptional: true,
  },
  {
    name: "-recover",
    sampleValue: "id",
    description: "recover from the checkpoint with the specified id",
    isOptional: true,
  },
  {
    name: "-terse",
    description: "do not expand values in Print statements; defaults to\nexpanding values",
    isOptional: true,
  },
  {
    name: "-tool",
    description:
      "run in 'tool' mode, surrounding output with message codes;\nif '-generateSpecTE' is specified, this is enabled\nautomatically",
    isOptional: true,
  },
  {
    name: "-userFile",
    sampleValue: "file",
    description:
      "an absolute path to a file in which to log user output (for\nexample, that which is produced by Print)",
    isOptional: true,
  },
  {
    name: "-workers",
    sampleValue: "num",
    description:
      "the number of TLC worker threads; defaults to 1. Use 'auto'\nto automatically select the number of threads based on the\nnumber of available cores.",
    isOptional: true,
  },
  {
    name: "-debugger",
    sampleValue: "nosuspend",
    description:
      "run simulation or model-checking in debug mode such that TLC's\nstate-space exploration can be temporarily halted and variables\nbe inspected. The only debug front-end so far is the TLA+\nVSCode extension, which has to be downloaded and configured\nseparately, though other front-ends could be implemeted via the\ndebug-adapter-protocol.\nSpecifying the optional parameter 'nosuspend' causes\nTLC to start state-space exploration without waiting for a\ndebugger front-end to connect. Without 'nosuspend', TLC\nsuspends state-space exploration before the first ASSUME is\nevaluated (but after constants are processed). With 'nohalt',\nTLC does not halt state-space exploration when an evaluation\nor runtime error is caught. Without 'nohalt', evaluation or\nruntime errors can be inspected in the debugger before TLC\nterminates. The optional parameter 'port=1274' makes the\ndebugger listen on port 1274 instead of on the standard\nport 4712, and 'port=0' lets the debugger choose a port.\nMultiple optional parameters must be comma-separated.\nSpecifying '-debugger' implies '-workers 1'.",
    isOptional: false,
    subOptions: "nosuspend",
  },
  { name: "SPEC", isOptional: false },
];

const COMMAND_VARIANTS = [
  [
    ...SHARED_ARGUMENTS,
    {
      name: "-dfid",
      sampleValue: "num",
      description:
        "run the model check in depth-first iterative deepening\nstarting with an initial depth of 'num'",
      isOptional: true,
    },
    {
      name: "-view",
      description: "apply VIEW (if provided) when printing out states",
      isOptional: true,
    },
  ],
  [
    ...SHARED_ARGUMENTS,
    {
      name: "-depth",
      sampleValue: "num",
      description: "specifies the depth of random simulation; defaults to 100",
      isOptional: true,
    },
    {
      name: "-seed",
      sampleValue: "num",
      description:
        "provide the seed for random simulation; defaults to a\nrandom long pulled from a pseudo-RNG",
      isOptional: true,
    },
    {
      name: "-aril",
      sampleValue: "num",
      description: "adjust the seed for random simulation; defaults to 0",
      isOptional: true,
    },
    {
      name: "-simulate",
      description:
        "run in simulation mode; optional parameters may be specified\ncomma delimited: 'num=X' where X is the maximum number of\ntotal traces to generate and/or 'file=Y' where Y is the\nabsolute-pathed prefix for trace file modules to be written\nby the simulation workers; for example Y='/a/b/c/tr' would\nproduce, e.g, '/a/b/c/tr_1_15'",
      isOptional: false,
      subOptions: "file=X,num=Y",
    },
  ],
];

const DESCRIPTION =
  "The model checker (TLC) provides the functionalities of model checking\nor simulation of TLA+ specifications. It may be invoked from the command\nline, or via the model checking functionality of the Toolbox.\n\nBy default, TLC starts in the model checking mode using breadth-first\napproach for the state space exploration.\n\nA pretty-printed and in-depth description of TLC can be found at:\n\n\t    https://lamport.azurewebsites.net/tla/current-tools.pdf";

const TIPS = [
  'When using the  \'-generateSpecTE\' you can version the generated specification by doing:\n\t./tla2tools.jar -generateSpecTE MySpec.tla && NAME="SpecTE-$(date +%s)" && sed -e "s/MODULE SpecTE/MODULE $NAME/g" SpecTE.tla > $NAME.tla',
  "If, while checking a SpecTE created via '-generateSpecTE', you get an error message concerning\nCONSTANT declaration and you've previous used 'integers' as model values, rename your\nmodel values to start with a non-numeral and rerun the model check to generate a new SpecTE.",
  "If, while checking a SpecTE created via '-generateSpecTE', you get a warning concerning\nduplicate operator definitions, this is likely due to the 'monolith' specification\ncreation. Try re-running TLC adding the 'nomonolith' option to the '-generateSpecTE'\nparameter.",
  "When using more than one worker, the reported depth might differ across runs. For small models, use a single worker. For large models, the diameter will almost always appear deterministic.",
];

const getBold = (word: string) => `\u001b[1m${word}\u001b[0m`;

const getItalic = (word: string) => `\u001b[3m${word}\u001b[0m`;

const isDashArgument = (argument: UsageArgument) =>
  argument.name.startsWith("-") && !argument.name.startsWith("--");

// Java's String.compareTo orders by UTF-16 code unit, as < does.
const compareNames = (left: UsageArgument, right: UsageArgument) =>
  left.name < right.name ? -1 : left.name > right.name ? 1 : 0;

const getSubOptions = (argument: UsageArgument) =>
  argument.subOptions === undefined ? "" : ` [${argument.subOptions}]`;

const getVariantSynopsis = (variant: UsageArgument[]) => {
  const sorted = [...variant].sort(compareNames);
  const singleDash = sorted.filter(
    (argument) =>
      argument.sampleValue === undefined && argument.isOptional && isDashArgument(argument),
  );
  const shortNames = singleDash
    .filter((argument) => argument.name.length === 2)
    .map((argument) => argument.name.slice(1))
    .join("");
  const requiredValueless = sorted
    .filter((argument) => argument.sampleValue === undefined && !argument.isOptional)
    .sort((left, right) =>
      isDashArgument(left) === isDashArgument(right)
        ? compareNames(left, right)
        : isDashArgument(left)
          ? -1
          : 1,
    );
  return [
    getBold("TLC"),
    ...(shortNames === "" ? [] : [`[${getBold(`-${shortNames}`)}]`]),
    ...singleDash
      .filter((argument) => argument.name.length !== 2)
      .map((argument) => `[${getBold(argument.name)}${getSubOptions(argument)}]`),
    ...sorted
      .filter(
        (argument) =>
          argument.sampleValue === undefined &&
          argument.isOptional &&
          argument.name.startsWith("--"),
      )
      .map((argument) => `[${getBold(argument.name)}${getSubOptions(argument)}]`),
    ...sorted
      .filter((argument) => argument.sampleValue !== undefined && argument.isOptional)
      .map(
        (argument) =>
          `[${getBold(argument.name)} ${argument.subOptions === undefined ? "" : `[${argument.subOptions}] `}${getItalic(argument.sampleValue ?? "")}]`,
      ),
    ...sorted
      .filter((argument) => argument.sampleValue !== undefined && !argument.isOptional)
      .map((argument) => `${getBold(argument.name)} ${getItalic(argument.sampleValue ?? "")}`),
    ...requiredValueless.map((argument) => `${argument.name}${getSubOptions(argument)}`),
  ].join(" ");
};

// TLC names its build by its UTC timestamp, or by the current time when it has no manifest.
const getBuildVersion = () =>
  new Date()
    .toISOString()
    .replace(/^(\d+)-(\d+)-(\d+)T(\d+):(\d+):(\d+).*$/, "Version $1.$2.$3.$4$5$6");

export const getTlcUsage = () => {
  const options = [
    ...new Map(
      COMMAND_VARIANTS.flat().map((argument) => [argument.name, argument] as const),
    ).values(),
  ]
    .sort(compareNames)
    .filter(
      (argument) =>
        argument.sampleValue !== undefined || argument.isOptional || isDashArgument(argument),
    );
  const indent = (text: string, prefix: string) => text.replace(/\r\n|\r|\n/g, `\n${prefix}`);
  return [
    "",
    `${getBold("NAME")}\n`,
    `\tTLC - provides model checking and simulation of TLA+ specifications - ${getBuildVersion()}\n\n`,
    `${getBold("SYNOPSIS")}\n`,
    ...COMMAND_VARIANTS.map((variant) => `\t${getVariantSynopsis(variant)}`),
    "",
    `${getBold("DESCRIPTION")}\n`,
    `\t${indent(DESCRIPTION.replace(/TLC(\)|\s|$)/g, `${getBold("TLC")}$1`), "\t")}`,
    "",
    `${getBold("OPTIONS")}\n`,
    ...options.map(
      (argument) =>
        `\t${getBold(argument.name)}${argument.sampleValue === undefined ? "" : ` ${getItalic(argument.sampleValue)}`}\n\t\t${indent(argument.description ?? "", "\t\t")}`,
    ),
    "",
    `${getBold("TIPS")}\n`,
    ...TIPS.map((tip) => `\t${indent(tip, "\t")}\n`),
  ].join("\n");
};
