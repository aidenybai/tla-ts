import { removeStaleTests, SET_VALUES, VALUES, writeTest, writeValueTest } from "./generate-common";
import { generateCheckerMatrix } from "./generate-checker";
import { generateConfigMatrix } from "./generate-config";
import { generateRandomExpressions } from "./generate-random";
import { generateTemporalMatrix } from "./generate-temporal";
import { generateBinaryMatrix } from "./generate-values";

interface Template {
  name: string;
  ref: string;
  render: (value: string) => string;
  tlcBugValues?: string[];
}

const UNARY_TEMPLATES: Template[] = [
  { name: "len", ref: "tlc2/module/Sequences.java#Len", render: (value) => `Len(${value})` },
  { name: "head", ref: "tlc2/module/Sequences.java#Head", render: (value) => `Head(${value})` },
  { name: "tail", ref: "tlc2/module/Sequences.java#Tail", render: (value) => `Tail(${value})` },
  {
    name: "seq",
    ref: "tlc2/module/Sequences.java#Seq",
    render: (value) => `<<1>> \\in Seq(${value})`,
  },
  {
    name: "append_to",
    ref: "tlc2/module/Sequences.java#Append",
    render: (value) => `Append(${value}, 9)`,
  },
  {
    name: "append_value",
    ref: "tlc2/module/Sequences.java#Append",
    render: (value) => `Append(<<1>>, ${value})`,
  },
  {
    name: "concat_left",
    ref: "tlc2/module/Sequences.java#Concat",
    render: (value) => `${value} \\o <<9>>`,
  },
  {
    name: "concat_right",
    ref: "tlc2/module/Sequences.java#Concat",
    render: (value) => `<<9>> \\o ${value}`,
  },
  {
    name: "subseq",
    ref: "tlc2/module/Sequences.java#SubSeq",
    render: (value) => `SubSeq(${value}, 1, 1)`,
  },
  {
    name: "selectseq",
    ref: "tlc2/module/Sequences.java#SelectSeq",
    render: (value) => `SelectSeq(${value}, LAMBDA e : TRUE)`,
  },
  {
    name: "cardinality",
    ref: "tlc2/module/FiniteSets.java#Cardinality",
    render: (value) => `Cardinality(${value})`,
  },
  {
    name: "is_finite_set",
    ref: "tlc2/module/FiniteSets.java#IsFiniteSet",
    render: (value) => `IsFiniteSet(${value})`,
  },
  {
    name: "subset_of",
    ref: "tlc2/value/impl/SubsetValue.java",
    render: (value) => `SUBSET ${value}`,
  },
  {
    name: "union_of",
    ref: "tlc2/value/impl/UnionValue.java",
    render: (value) => `UNION ${value}`,
    // TLC's error names its Java enumerator object, not the value.
    tlcBugValues: [
      "bag",
      "colon_greater",
      "double_at",
      "false",
      "function_empty",
      "function_lazy",
      "function_pair_domain",
      "function_strings",
      "function",
      "int_minimum",
      "int_negative",
      "int_one",
      "int_maximum",
      "int",
      "int_zero",
      "record_nested",
      "nat",
      "record",
      "model_value",
      "seq_set",
      "string_escapes",
      "string_empty",
      "string_a",
      "string_set",
      "true",
      "tuple_mixed",
      "tuple_empty",
      "tuple",
    ],
  },
  {
    name: "domain",
    ref: "tlc2/tool/impl/Tool.java#OPCODE_domain",
    render: (value) => `DOMAIN ${value}`,
  },
  { name: "negate", ref: "tlc2/module/Integers.java#Neg", render: (value) => `-(${value})` },
  { name: "not", ref: "tlc2/tool/impl/Tool.java#OPCODE_lnot", render: (value) => `~(${value})` },
  {
    name: "if_condition",
    ref: "tlc2/tool/impl/Tool.java#OPCODE_ite",
    render: (value) => `IF ${value} THEN 1 ELSE 2`,
  },
  {
    name: "case_guard",
    ref: "tlc2/tool/impl/Tool.java#OPCODE_case",
    render: (value) => `CASE ${value} -> 1 [] OTHER -> 2`,
  },
  {
    name: "and_left",
    ref: "tlc2/tool/impl/Tool.java#OPCODE_land",
    render: (value) => `${value} /\\ TRUE`,
  },
  {
    name: "and_right",
    ref: "tlc2/tool/impl/Tool.java#OPCODE_land",
    render: (value) => `TRUE /\\ ${value}`,
  },
  {
    name: "or_left",
    ref: "tlc2/tool/impl/Tool.java#OPCODE_lor",
    render: (value) => `${value} \\/ FALSE`,
  },
  {
    name: "or_right",
    ref: "tlc2/tool/impl/Tool.java#OPCODE_lor",
    render: (value) => `FALSE \\/ ${value}`,
  },
  {
    name: "implies_left",
    ref: "tlc2/tool/impl/Tool.java#OPCODE_implies",
    render: (value) => `${value} => TRUE`,
  },
  {
    name: "implies_right",
    ref: "tlc2/tool/impl/Tool.java#OPCODE_implies",
    render: (value) => `TRUE => ${value}`,
  },
  {
    name: "equiv",
    ref: "tlc2/tool/impl/Tool.java#OPCODE_equiv",
    render: (value) => `${value} <=> TRUE`,
  },
  { name: "plus_left", ref: "tlc2/module/Naturals.java#Plus", render: (value) => `${value} + 1` },
  { name: "plus_right", ref: "tlc2/module/Naturals.java#Plus", render: (value) => `1 + ${value}` },
  { name: "minus_left", ref: "tlc2/module/Naturals.java#Minus", render: (value) => `${value} - 1` },
  { name: "times_left", ref: "tlc2/module/Naturals.java#Times", render: (value) => `${value} * 2` },
  { name: "power_base", ref: "tlc2/module/Naturals.java#Expt", render: (value) => `${value} ^ 2` },
  {
    name: "power_exponent",
    ref: "tlc2/module/Naturals.java#Expt",
    render: (value) => `2 ^ (${value})`,
  },
  {
    name: "div_dividend",
    ref: "tlc2/module/Naturals.java#Divide",
    render: (value) => `${value} \\div 2`,
  },
  {
    name: "div_divisor",
    ref: "tlc2/module/Naturals.java#Divide",
    render: (value) => `7 \\div (${value})`,
  },
  { name: "mod_dividend", ref: "tlc2/module/Naturals.java#Mod", render: (value) => `${value} % 2` },
  {
    name: "mod_divisor",
    ref: "tlc2/module/Naturals.java#Mod",
    render: (value) => `7 % (${value})`,
  },
  { name: "less_left", ref: "tlc2/module/Naturals.java#LT", render: (value) => `${value} < 2` },
  {
    name: "greater_equal_right",
    ref: "tlc2/module/Naturals.java#GEQ",
    render: (value) => `2 >= ${value}`,
  },
  {
    name: "interval_low",
    ref: "tlc2/module/Naturals.java#DotDot",
    render: (value) => `${value} .. 2`,
  },
  {
    name: "interval_high",
    ref: "tlc2/module/Naturals.java#DotDot",
    render: (value) => `1 .. ${value}`,
  },
  {
    name: "cup_left",
    ref: "tlc2/value/impl/SetCupValue.java",
    render: (value) => `${value} \\cup {9}`,
  },
  {
    name: "cap_right",
    ref: "tlc2/value/impl/SetCapValue.java",
    render: (value) => `{1, 2} \\cap ${value}`,
  },
  {
    name: "diff_left",
    ref: "tlc2/value/impl/SetDiffValue.java",
    render: (value) => `${value} \\ {1}`,
  },
  {
    name: "diff_right",
    ref: "tlc2/value/impl/SetDiffValue.java",
    render: (value) => `{1, 2} \\ ${value}`,
  },
  {
    name: "subseteq_left",
    ref: "tlc2/tool/impl/Tool.java#OPCODE_subseteq",
    render: (value) => `${value} \\subseteq {1, 2}`,
  },
  {
    name: "subseteq_right",
    ref: "tlc2/tool/impl/Tool.java#OPCODE_subseteq",
    render: (value) => `{1} \\subseteq ${value}`,
  },
  {
    name: "cross_left",
    ref: "tlc2/value/impl/SetOfTuplesValue.java",
    render: (value) => `${value} \\X {9}`,
  },
  {
    name: "funcset_domain",
    ref: "tlc2/value/impl/SetOfFcnsValue.java",
    render: (value) => `[${value} -> {9}]`,
  },
  {
    name: "funcset_range",
    ref: "tlc2/value/impl/SetOfFcnsValue.java",
    render: (value) => `[{9} -> ${value}]`,
  },
  {
    name: "recordset_field",
    ref: "tlc2/value/impl/SetOfRcdsValue.java",
    render: (value) => `[f : ${value}]`,
  },
  {
    name: "choose_from",
    ref: "tlc2/tool/impl/Tool.java#OPCODE_bc",
    render: (value) => `CHOOSE e \\in ${value} : TRUE`,
  },
  {
    name: "forall_over",
    ref: "tlc2/tool/impl/Tool.java#OPCODE_be",
    render: (value) => `\\A e \\in ${value} : TRUE`,
  },
  {
    name: "exists_over",
    ref: "tlc2/tool/impl/Tool.java#OPCODE_bf",
    render: (value) => `\\E e \\in ${value} : TRUE`,
  },
  {
    name: "filter_over",
    ref: "tlc2/value/impl/SetPredValue.java",
    render: (value) => `{e \\in ${value} : TRUE}`,
  },
  {
    name: "map_over",
    ref: "tlc2/tool/impl/Tool.java#OPCODE_sso",
    render: (value) => `{e : e \\in ${value}}`,
  },
  {
    name: "function_over",
    ref: "tlc2/value/impl/FcnLambdaValue.java",
    render: (value) => `[e \\in ${value} |-> e]`,
  },
  {
    name: "tuple_pattern",
    ref: "tlc2/util/Context.java",
    render: (value) => `{a : <<a, b>> \\in ${value}}`,
    // TLC's message for a binder that doesn't match ends in its unfilled %1.
    tlcBugValues: [
      "boolean_set",
      "interval",
      "set_cup",
      "set_cap",
      "set_diff",
      "set_ints",
      "set_filter",
      "set_map",
      "set_of_functions",
      "set_nested",
      "set_of_records",
      "subset",
      "union",
    ],
  },
  {
    name: "apply_function",
    ref: "tlc2/value/impl/FcnRcdValue.java#apply",
    render: (value) => `(${value})[1]`,
  },
  {
    name: "apply_argument",
    ref: "tlc2/value/impl/FcnRcdValue.java#apply",
    render: (value) => `[e \\in {1, 2} |-> e][${value}]`,
  },
  {
    name: "field_of",
    ref: "tlc2/value/impl/RecordValue.java#select",
    render: (value) => `(${value}).a`,
  },
  {
    name: "except_on",
    ref: "tlc2/tool/impl/Tool.java#OPCODE_exc",
    render: (value) => `[${value} EXCEPT ![1] = 9]`,
  },
  {
    name: "except_key",
    ref: "tlc2/tool/impl/Tool.java#OPCODE_exc",
    render: (value) => `[<<1, 2>> EXCEPT ![${value}] = 9]`,
  },
  {
    name: "except_field",
    ref: "tlc2/tool/impl/Tool.java#OPCODE_exc",
    render: (value) => `[${value} EXCEPT !.a = 9]`,
  },
  {
    name: "function_merge_left",
    ref: "tlc2/module/TLC.java#CombineFcn",
    render: (value) => `${value} @@ (9 :> 9)`,
  },
  {
    name: "colon_greater_key",
    ref: "tlc2/module/TLC.java#MakeFcn",
    render: (value) => `${value} :> 1`,
  },
  {
    name: "permutations",
    ref: "tlc2/module/TLC.java#Permutations",
    render: (value) => `Permutations(${value})`,
  },
  {
    name: "sortseq",
    ref: "tlc2/module/TLC.java#SortSeq",
    render: (value) => `SortSeq(${value}, LAMBDA a, b : a < b)`,
  },
  {
    name: "random_element",
    ref: "tlc2/module/TLC.java#RandomElement",
    render: (value) => `RandomElement(${value})`,
  },
  {
    name: "to_string",
    ref: "tlc2/module/TLC.java#ToString",
    render: (value) => `ToString(${value})`,
  },
  { name: "is_a_bag", ref: "tlc2/module/Bags.java#IsABag", render: (value) => `IsABag(${value})` },
  {
    name: "bag_to_set",
    ref: "tlc2/module/Bags.java#BagToSet",
    render: (value) => `BagToSet(${value})`,
  },
  {
    name: "set_to_bag",
    ref: "tlc2/module/Bags.java#SetToBag",
    render: (value) => `SetToBag(${value})`,
  },
  { name: "bag_in", ref: "tlc2/module/Bags.java#BagIn", render: (value) => `BagIn(1, ${value})` },
  {
    name: "copies_in",
    ref: "tlc2/module/Bags.java#CopiesIn",
    render: (value) => `CopiesIn(1, ${value})`,
  },
  {
    name: "bag_plus",
    ref: "tlc2/module/Bags.java#BagUnion",
    render: (value) => `${value} (+) SetToBag({1})`,
  },
  {
    name: "bag_minus",
    ref: "tlc2/module/Bags.java#BagDiff",
    render: (value) => `${value} (-) SetToBag({1})`,
  },
  {
    name: "bag_union",
    ref: "tlc2/module/Bags.java#BagUnion",
    render: (value) => `BagUnion(${value})`,
  },
  { name: "subbag", ref: "tlc2/module/Bags.java#SubBag", render: (value) => `SubBag(${value})` },
  {
    name: "bag_cardinality",
    ref: "tlc2/module/Bags.java#BagCardinality",
    render: (value) => `BagCardinality(${value})`,
  },
];

const generateOperatorMatrix = () =>
  UNARY_TEMPLATES.forEach((template) =>
    VALUES.forEach((value) =>
      writeValueTest(
        `operators/${template.name}`,
        `${template.name}_${value.name}`,
        `${template.name} applied to ${value.name}, a ${value.valueClass}.`,
        template.ref,
        template.render(value.text),
        template.tlcBugValues?.includes(value.name),
      ),
    ),
  );

const generateEqualityMatrix = () =>
  VALUES.forEach((left) =>
    VALUES.forEach((right) =>
      writeValueTest(
        `equality/${left.name}`,
        `equals_${left.name}__${right.name}`,
        `Compares ${left.name}, a ${left.valueClass}, with ${right.name}, a ${right.valueClass}.`,
        `tlc2/value/impl/${left.valueClass}.java#equals`,
        `(${left.text}) = (${right.text})`,
      ),
    ),
  );

const generateMembershipMatrix = () =>
  VALUES.forEach((element) =>
    SET_VALUES.forEach((set) =>
      writeValueTest(
        `membership/${set.name}`,
        `in_${set.name}__${element.name}`,
        `Asks whether ${element.name} is in ${set.name}, a ${set.valueClass}.`,
        `tlc2/value/impl/${set.valueClass}.java#member`,
        `(${element.text}) \\in (${set.text})`,
      ),
    ),
  );

const INFIX_OPERATORS = [
  { name: "implies_like", symbol: "-+->", isDefinable: true },
  { name: "cdot", symbol: "\\cdot", isDefinable: true },
  { name: "doteq", symbol: "\\doteq", isDefinable: true },
  { name: "less", symbol: "<", isDefinable: true },
  { name: "sqsubseteq", symbol: "\\sqsubseteq", isDefinable: true },
  { name: "colon_equals", symbol: ":=", isDefinable: true },
  { name: "pipe_dash", symbol: "|-", isDefinable: true },
  { name: "at_at", symbol: "@@", isDefinable: true },
  { name: "colon_greater", symbol: ":>", isDefinable: true },
  { name: "less_colon", symbol: "<:", isDefinable: true },
  { name: "dot_dot", symbol: "..", isDefinable: true },
  { name: "dot_dot_dot", symbol: "...", isDefinable: true },
  { name: "bang_bang", symbol: "!!", isDefinable: true },
  { name: "hash_hash", symbol: "##", isDefinable: true },
  { name: "dollar", symbol: "$", isDefinable: true },
  { name: "question", symbol: "??", isDefinable: true },
  { name: "sqcap", symbol: "\\sqcap", isDefinable: true },
  { name: "sqcup", symbol: "\\sqcup", isDefinable: true },
  { name: "uplus", symbol: "\\uplus", isDefinable: true },
  { name: "wr", symbol: "\\wr", isDefinable: true },
  { name: "oplus", symbol: "(+)", isDefinable: true },
  { name: "plus", symbol: "+", isDefinable: true },
  { name: "plus_plus", symbol: "++", isDefinable: true },
  { name: "percent", symbol: "%", isDefinable: true },
  { name: "percent_percent", symbol: "%%", isDefinable: true },
  { name: "pipe", symbol: "|", isDefinable: true },
  { name: "pipe_pipe", symbol: "||", isDefinable: true },
  { name: "minus", symbol: "-", isDefinable: true },
  { name: "minus_minus", symbol: "--", isDefinable: true },
  { name: "ampersand", symbol: "&", isDefinable: true },
  { name: "ampersand_ampersand", symbol: "&&", isDefinable: true },
  { name: "odot", symbol: "(.)", isDefinable: true },
  { name: "oslash", symbol: "(/)", isDefinable: true },
  { name: "otimes", symbol: "(\\X)", isDefinable: true },
  { name: "star", symbol: "*", isDefinable: true },
  { name: "star_star", symbol: "**", isDefinable: true },
  { name: "slash", symbol: "/", isDefinable: true },
  { name: "slash_slash", symbol: "//", isDefinable: true },
  { name: "bigcirc", symbol: "\\bigcirc", isDefinable: true },
  { name: "bullet", symbol: "\\bullet", isDefinable: true },
  { name: "div", symbol: "\\div", isDefinable: true },
  { name: "o", symbol: "\\o", isDefinable: true },
  { name: "star_op", symbol: "\\star", isDefinable: true },
  { name: "caret", symbol: "^", isDefinable: true },
  { name: "caret_caret", symbol: "^^", isDefinable: true },
  { name: "greater", symbol: ">", isDefinable: true },
  { name: "less_equal", symbol: "<=", isDefinable: true },
  { name: "greater_equal", symbol: ">=", isDefinable: true },
  { name: "prec", symbol: "\\prec", isDefinable: true },
  { name: "succ", symbol: "\\succ", isDefinable: true },
  { name: "preceq", symbol: "\\preceq", isDefinable: true },
  { name: "succeq", symbol: "\\succeq", isDefinable: true },
  { name: "ll", symbol: "\\ll", isDefinable: true },
  { name: "gg", symbol: "\\gg", isDefinable: true },
  { name: "sim", symbol: "\\sim", isDefinable: true },
  { name: "simeq", symbol: "\\simeq", isDefinable: true },
  { name: "asymp", symbol: "\\asymp", isDefinable: true },
  { name: "approx", symbol: "\\approx", isDefinable: true },
  { name: "cong", symbol: "\\cong", isDefinable: true },
  { name: "propto", symbol: "\\propto", isDefinable: true },
  { name: "sqsubset", symbol: "\\sqsubset", isDefinable: true },
  { name: "sqsupset", symbol: "\\sqsupset", isDefinable: true },
  { name: "sqsupseteq", symbol: "\\sqsupseteq", isDefinable: true },
  { name: "subset_symbol", symbol: "\\subset", isDefinable: true },
  { name: "supset", symbol: "\\supset", isDefinable: true },
  { name: "supseteq", symbol: "\\supseteq", isDefinable: true },
  { name: "dashv", symbol: "-|", isDefinable: true },
  { name: "models", symbol: "|=", isDefinable: true },
  { name: "equals_pipe", symbol: "=|", isDefinable: true },
  { name: "colon_colon_equals", symbol: "::=", isDefinable: true },
];

const PRECEDENCE_REF = "tla2sany/parser/Operators.java; Specifying Systems 15.2.1";

const generatePrecedenceMatrix = () =>
  INFIX_OPERATORS.forEach((first) =>
    INFIX_OPERATORS.forEach((second) => {
      const moduleName = `prec_${first.name}__${second.name}`;
      const render = (symbol: string) =>
        `a ${symbol} b == <<"${symbol.replaceAll("\\", "\\\\")}", a, b>>`;
      const definitions =
        first.symbol === second.symbol
          ? [render(first.symbol)]
          : [render(first.symbol), render(second.symbol)];
      writeTest(
        `precedence/${first.name}`,
        {
          description: `Groups ${first.symbol} against ${second.symbol}, or rejects them as conflicting.`,
          ref: PRECEDENCE_REF,
          features: ["operator-precedence"],
          flags: ["expression"],
          contexts: ["assume"],
          outcome: "any",
        },
        moduleName,
        `EXTENDS TLC\n${definitions.join("\n")}\nTest == PrintT(1 ${first.symbol} 2 ${second.symbol} 3)`,
      );
    }),
  );

const LEVEL_EXPRESSIONS = [
  { name: "constant", text: "c" },
  { name: "state", text: "x" },
  { name: "action", text: "x'" },
  { name: "temporal", text: "[](x = 0)" },
];

const LEVEL_CONSUMERS = [
  { name: "assume", render: (value: string) => `ASSUME ${value}` },
  { name: "prime", render: (value: string) => `Op == (${value})'` },
  { name: "unchanged", render: (value: string) => `Op == UNCHANGED (${value})` },
  { name: "enabled", render: (value: string) => `Op == ENABLED (${value})` },
  { name: "always", render: (value: string) => `Op == [](${value})` },
  { name: "eventually", render: (value: string) => `Op == <>(${value})` },
  { name: "leads_to", render: (value: string) => `Op == (${value}) ~> (x = 0)` },
  { name: "box_action", render: (value: string) => `Op == [][${value}]_x` },
  { name: "angle_action", render: (value: string) => `Op == <><<${value}>>_x` },
  { name: "subscript", render: (value: string) => `Op == [][x' = x]_(${value})` },
  { name: "weak_fairness", render: (value: string) => `Op == WF_x(${value})` },
  { name: "strong_fairness", render: (value: string) => `Op == SF_x(${value})` },
  { name: "weak_fairness_subscript", render: (value: string) => `Op == WF_(${value})(x' = x)` },
  { name: "set_element", render: (value: string) => `Op == {${value}}` },
  { name: "function_body", render: (value: string) => `Op == [e \\in {1} |-> ${value}]` },
  { name: "quantifier_bound", render: (value: string) => `Op == \\E e \\in {${value}} : TRUE` },
  { name: "choose_body", render: (value: string) => `Op == CHOOSE e \\in {1} : ${value}` },
  { name: "if_condition", render: (value: string) => `Op == IF ${value} THEN 1 ELSE 2` },
  { name: "let_body", render: (value: string) => `Op == LET d == ${value} IN d` },
  { name: "operator_argument", render: (value: string) => `F(a) == a'\nOp == F(${value})` },
  {
    name: "constant_operator_argument",
    render: (value: string) => `CONSTANT G(_)\nOp == G(${value})`,
  },
  {
    name: "recursive_body",
    render: (value: string) => `RECURSIVE R(_)\nR(n) == ${value}\nOp == R(1)`,
  },
  {
    name: "instance_substitution",
    render: (value: string) =>
      `---- MODULE Inner ----\nCONSTANT p\n====\nI == INSTANCE Inner WITH p <- ${value}`,
  },
];

const generateLevelMatrix = () =>
  LEVEL_CONSUMERS.forEach((consumer) =>
    LEVEL_EXPRESSIONS.forEach((level) =>
      writeTest(
        "levels",
        {
          description: `Level-checks a ${level.name}-level expression in ${consumer.name}.`,
          ref: "tla2sany/semantic/LevelNode.java; Specifying Systems 17.2",
          features: ["level-checking"],
          outcome: "any",
        },
        `level_${consumer.name}__${level.name}`,
        `CONSTANT c\nVARIABLE x\n${consumer.render(level.text)}`,
      ),
    ),
  );

generateOperatorMatrix();
generateEqualityMatrix();
generateMembershipMatrix();
generatePrecedenceMatrix();
generateLevelMatrix();
generateBinaryMatrix();
generateTemporalMatrix();
generateCheckerMatrix();
generateConfigMatrix();
generateRandomExpressions();
removeStaleTests();
