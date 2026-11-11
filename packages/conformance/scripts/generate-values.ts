import { VALUES, writeValueTest } from "./generate-common";

interface BinaryOperator {
  name: string;
  ref: string;
  render: (left: string, right: string) => string;
  tlcBugPairs?: string[];
}

const BINARY_OPERATORS: BinaryOperator[] = [
  {
    name: "cup",
    ref: "tlc2/value/impl/SetCupValue.java",
    render: (left, right) => `(${left}) \\cup (${right})`,
  },
  {
    name: "cap",
    ref: "tlc2/value/impl/SetCapValue.java",
    render: (left, right) => `(${left}) \\cap (${right})`,
  },
  {
    name: "diff",
    ref: "tlc2/value/impl/SetDiffValue.java",
    render: (left, right) => `(${left}) \\ (${right})`,
  },
  {
    name: "subseteq",
    ref: "tlc2/tool/impl/Tool.java#OPCODE_subseteq",
    render: (left, right) => `(${left}) \\subseteq (${right})`,
  },
  {
    name: "cross",
    ref: "tlc2/value/impl/SetOfTuplesValue.java",
    render: (left, right) => `(${left}) \\X (${right})`,
  },
  {
    name: "function_set",
    ref: "tlc2/value/impl/SetOfFcnsValue.java",
    render: (left, right) => `[(${left}) -> (${right})]`,
  },
  {
    name: "record_set",
    ref: "tlc2/value/impl/SetOfRcdsValue.java",
    render: (left, right) => `[f : (${left}), g : (${right})]`,
  },
  {
    name: "concat",
    ref: "tlc2/module/Sequences.java#Concat",
    render: (left, right) => `(${left}) \\o (${right})`,
  },
  {
    name: "merge",
    ref: "tlc2/module/TLC.java#CombineFcn",
    render: (left, right) => `(${left}) @@ (${right})`,
  },
  {
    name: "colon_greater",
    ref: "tlc2/module/TLC.java#MakeFcn",
    render: (left, right) => `(${left}) :> (${right})`,
  },
  {
    name: "apply",
    ref: "tlc2/value/impl/FcnRcdValue.java#apply",
    render: (left, right) => `(${left})[${right}]`,
    // TLC indexes past an argument shorter than the parameters, and prints the Java exception.
    tlcBugPairs: [
      "function_pair_domain__bag",
      "function_pair_domain__function_empty",
      "function_pair_domain__tuple_empty",
    ],
  },
  {
    name: "append",
    ref: "tlc2/module/Sequences.java#Append",
    render: (left, right) => `Append(${left}, ${right})`,
  },
];

const generateBinaryOperator = (operator: BinaryOperator) =>
  VALUES.forEach((left) =>
    VALUES.forEach((right) =>
      writeValueTest(
        `binary/${operator.name}/${left.name}`,
        `${operator.name}_${left.name}__${right.name}`,
        `${operator.name} of ${left.name}, a ${left.valueClass}, and ${right.name}, a ${right.valueClass}.`,
        operator.ref,
        operator.render(left.text, right.text),
        operator.tlcBugPairs?.includes(`${left.name}__${right.name}`),
      ),
    ),
  );

const ARITHMETIC_OPERATORS = ["+", "-", "*", "\\div", "%", "^", "<", "<=", "..", "/="];
const ARITHMETIC_NAMES = [
  "plus",
  "minus",
  "times",
  "div",
  "mod",
  "power",
  "less",
  "less_equal",
  "interval",
  "not_equal",
];
const INTEGER_VALUES = VALUES.filter((value) => value.valueClass === "IntValue");

const generateArithmetic = () =>
  ARITHMETIC_OPERATORS.forEach((symbol, index) =>
    INTEGER_VALUES.forEach((left) =>
      VALUES.forEach((right) =>
        writeValueTest(
          `arithmetic/${ARITHMETIC_NAMES[index]}`,
          `${ARITHMETIC_NAMES[index]}_${left.name}__${right.name}`,
          `${symbol} of ${left.name} and ${right.name}, including overflow and type errors.`,
          "tlc2/module/Naturals.java; tlc2/module/Integers.java",
          `(${left.text}) ${symbol} (${right.text})`,
        ),
      ),
    ),
  );

export const generateBinaryMatrix = () => {
  BINARY_OPERATORS.forEach(generateBinaryOperator);
  generateArithmetic();
};
