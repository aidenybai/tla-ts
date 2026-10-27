export interface OptionSpec {
  flag: string;
  isRequired?: boolean;
  isRepeatable?: boolean;
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
  return { usage: usage.replace("{options}", specs.map(formatOption).join(" ")), parse };
};
