interface OptionSpec {
  flag: string;
  isRepeatable?: boolean;
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

export const defineCommand = (usage: string, specs: OptionSpec[]) => {
  const arities = new Map(
    specs.map((spec) => {
      const [name, ...values] = spec.flag.split(" ");
      return [name, values.length];
    }),
  );
  const parse = (args: string[]): ParsedArgs => {
    const options: ParsedOption[] = [];
    const positionals: string[] = [];
    const unknown: string[] = [];
    for (let index = 0; index < args.length; index++) {
      const arity = arities.get(args[index]);
      if (arity === undefined) {
        (args[index].startsWith("-") ? unknown : positionals).push(args[index]);
        continue;
      }
      options.push({ name: args[index], values: args.slice(index + 1, index + 1 + arity) });
      index += arity;
    }
    return {
      options,
      positionals,
      unknown,
      incomplete: options.find((option) => option.values.length < (arities.get(option.name) ?? 0)),
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
  { flag: "--debug <flags>", isRepeatable: true },
  { flag: "--method <methods>" },
  { flag: "--solver <command>" },
  { flag: "--smt-logic <logic>" },
  { flag: "--stretch <factor>" },
  { flag: "--noflatten" },
]);

export const USAGE = [
  "Usage: tla-ts <Spec.tla|Spec.cfg|spec.ts|glob>... [-config <Spec.cfg>] [-continue] [-deadlock] [-dump [<format>] <file>] [-fp <num>] [-lncheck <final|default|off>] [-maxSetSize <num>] [-metadir <directory>] [-nowarning] [-seed <num>] [-terse] [-tool] [-view] [-workers <count|auto>]",
  `       ${TLAPM_COMMAND.usage}`,
  "       tla-ts [<JVM option>]... tlc2.TLC <TLC option>... <Spec>",
  "       (-cp tla2tools.jar or -Dtla-ts.tlc=1.7.4 picks the TLC to reproduce)",
  "       tla-ts [<JVM option>]... tla2sany.xml.XMLExporter [-I <directory>]... [-o] [-t] [-r] [-u] <Module.tla>",
].join("\n");
