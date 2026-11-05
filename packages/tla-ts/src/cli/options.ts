interface OptionSpec {
  flag: string;
  isRepeatable?: boolean;
  // How many of the arguments after the flag the option takes, when that depends on them.
  getArity?: (rest: string[]) => number;
}

interface ParsedOption {
  name: string;
  values: string[];
}

export interface ParsedArgs {
  options: ParsedOption[];
  positionals: string[];
  unknown: string[];
  incomplete: ParsedOption | undefined;
  has: (name: string) => boolean;
  get: (name: string) => string[] | undefined;
}

// Each <name> in a flag such as "--toolbox <start> <end>" is one value the option takes, and
// {options} in the usage stands for the options.
export const defineCommand = (usage: string, specs: OptionSpec[]) => {
  const arities = new Map(
    specs.map((spec) => {
      const [name, ...values] = spec.flag.split(" ");
      return [name, spec.getArity ?? (() => values.length)];
    }),
  );
  const parse = (args: string[]): ParsedArgs => {
    const options: ParsedOption[] = [];
    const positionals: string[] = [];
    const unknown: string[] = [];
    const incomplete: ParsedOption[] = [];
    for (let index = 0; index < args.length; index++) {
      const getArity = arities.get(args[index]);
      if (getArity === undefined) {
        (args[index].startsWith("-") ? unknown : positionals).push(args[index]);
        continue;
      }
      const arity = getArity(args.slice(index + 1));
      const option = { name: args[index], values: args.slice(index + 1, index + 1 + arity) };
      options.push(option);
      if (option.values.length < arity) incomplete.push(option);
      index += arity;
    }
    return {
      options,
      positionals,
      unknown,
      incomplete: incomplete[0],
      has: (name) => options.some((option) => option.name === name),
      get: (name) => options.findLast((option) => option.name === name)?.values,
    };
  };
  return {
    usage: usage.replace(
      "{options}",
      specs.map((spec) => `[${spec.flag}]${spec.isRepeatable ? "..." : ""}`).join(" "),
    ),
    parse,
  };
};

export const CHECK_COMMAND = defineCommand("tla-ts <Spec.tla|Spec.cfg|glob>... {options}", [
  { flag: "-config <Spec.cfg>" },
  { flag: "-continue" },
  { flag: "-deadlock" },
  // Like TLC, -dump takes a format only when the next argument starts with dot and a file follows.
  {
    flag: "-dump [<format>] <file>",
    getArity: (rest) => (rest.length > 1 && rest[0].startsWith("dot") ? 2 : 1),
  },
  { flag: "-fp <num>" },
  { flag: "-lncheck <final|default>" },
  { flag: "-metadir <directory>" },
  { flag: "-nowarning" },
  { flag: "-seed <num>" },
  { flag: "-tool" },
  { flag: "-workers <count|auto>" },
]);

export const TLAPM_COMMAND = defineCommand("tla-ts tlapm {options} <Module.tla|glob>...", [
  { flag: "-N" },
  { flag: "--summary" },
  { flag: "--strict" },
  { flag: "--toolbox <start> <end>" },
  { flag: "--line <num>" },
  { flag: "--printallobs" },
  { flag: "--threads <num>" },
  { flag: "--version" },
  { flag: "-I <directory>", isRepeatable: true },
  { flag: "-k" },
  { flag: "--noproving" },
  { flag: "--nofp" },
  { flag: "--nofpl <start> <end>" },
  { flag: "--safefp" },
  { flag: "--cleanfp" },
  { flag: "--usefp <file>" },
  { flag: "--cache-dir <directory>" },
]);

export const USAGE = [
  `Usage: ${CHECK_COMMAND.usage}`,
  `       ${TLAPM_COMMAND.usage}`,
  "       tla-ts [<JVM option>]... tlc2.TLC <TLC option>... <Spec>",
  "       (-cp tla2tools.jar or -Dtla-ts.tlc=1.7.4 picks the TLC to reproduce)",
  "       tla-ts [<JVM option>]... tla2sany.xml.XMLExporter [-I <directory>]... [-o] [-t] [-r] [-u] <Module.tla>",
].join("\n");
