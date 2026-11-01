export interface OptionSpec {
  flag: string;
  isRequired?: boolean;
  isRepeatable?: boolean;
  // How many of the arguments after the flag the option takes, when that depends on them.
  getArity?: (rest: string[]) => number;
}

export interface ParsedOption {
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

const formatOption = (spec: OptionSpec) => {
  const text = spec.isRequired ? spec.flag : `[${spec.flag}]`;
  return spec.isRepeatable ? `${text}...` : text;
};

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
  return { usage: usage.replace("{options}", specs.map(formatOption).join(" ")), parse };
};
