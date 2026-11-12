import { isDeepStrictEqual } from "node:util";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  keepCorrection,
  listFiles,
  parseTest,
  renderTest,
  SUITE_DIRECTORY,
  type TestMetadata,
} from "./test-file";

export const GENERATED_DIRECTORY = join(SUITE_DIRECTORY, "tlc/generated");
export const MODULES = "Integers, Sequences, FiniteSets, Bags, TLC";

export interface NamedValue {
  name: string;
  text: string;
  valueClass: string;
}

export const VALUES: NamedValue[] = [
  { name: "true", text: "TRUE", valueClass: "BoolValue" },
  { name: "false", text: "FALSE", valueClass: "BoolValue" },
  { name: "int_zero", text: "0", valueClass: "IntValue" },
  { name: "int_one", text: "1", valueClass: "IntValue" },
  { name: "int_negative", text: "-3", valueClass: "IntValue" },
  { name: "int_maximum", text: "2147483647", valueClass: "IntValue" },
  // The literal 2147483648 is too big for TLC, so the minimum needs an expression.
  { name: "int_minimum", text: "(-2147483647 - 1)", valueClass: "IntValue" },
  { name: "string_empty", text: '""', valueClass: "StringValue" },
  { name: "string_a", text: '"a"', valueClass: "StringValue" },
  { name: "string_escapes", text: '"a\\"b\\\\c\\n"', valueClass: "StringValue" },
  { name: "model_value", text: "mv", valueClass: "ModelValue" },
  { name: "set_empty", text: "{}", valueClass: "SetEnumValue" },
  { name: "set_ints", text: "{2, 1}", valueClass: "SetEnumValue" },
  { name: "set_mixed", text: '{1, "a"}', valueClass: "SetEnumValue" },
  { name: "set_nested", text: "{{1}, {}}", valueClass: "SetEnumValue" },
  { name: "interval", text: "1..3", valueClass: "IntervalValue" },
  { name: "interval_empty", text: "3..1", valueClass: "IntervalValue" },
  { name: "set_cap", text: "{1, 2} \\cap {2, 3}", valueClass: "SetCapValue" },
  { name: "set_cup", text: "{1} \\cup {2}", valueClass: "SetCupValue" },
  { name: "set_diff", text: "{1, 2} \\ {2}", valueClass: "SetDiffValue" },
  { name: "subset", text: "SUBSET {1, 2}", valueClass: "SubsetValue" },
  { name: "union", text: "UNION {{1}, {2}}", valueClass: "UnionValue" },
  { name: "cross", text: "{1, 2} \\X {3}", valueClass: "SetOfTuplesValue" },
  { name: "set_of_records", text: "[a : {1, 2}]", valueClass: "SetOfRcdsValue" },
  { name: "set_of_functions", text: "[{1} -> {2, 3}]", valueClass: "SetOfFcnsValue" },
  { name: "set_filter", text: "{x \\in 1..3 : x > 1}", valueClass: "SetPredValue" },
  { name: "set_map", text: "{x + 1 : x \\in 1..2}", valueClass: "SetEnumValue" },
  { name: "nat", text: "Nat", valueClass: "UserValue" },
  { name: "int", text: "Int", valueClass: "UserValue" },
  { name: "string_set", text: "STRING", valueClass: "UserValue" },
  { name: "boolean_set", text: "BOOLEAN", valueClass: "SetEnumValue" },
  { name: "seq_set", text: "Seq({1})", valueClass: "UserValue" },
  { name: "function", text: "[x \\in {1, 2} |-> x * 2]", valueClass: "FcnRcdValue" },
  { name: "function_lazy", text: "[x \\in Nat |-> x]", valueClass: "FcnLambdaValue" },
  { name: "function_empty", text: "[x \\in {} |-> x]", valueClass: "FcnRcdValue" },
  {
    name: "function_pair_domain",
    text: "[x \\in {1}, y \\in {2} |-> x + y]",
    valueClass: "FcnRcdValue",
  },
  { name: "function_strings", text: '[x \\in {"a", "b"} |-> x]', valueClass: "FcnRcdValue" },
  { name: "tuple_empty", text: "<<>>", valueClass: "TupleValue" },
  { name: "tuple", text: "<<1, 2>>", valueClass: "TupleValue" },
  { name: "tuple_mixed", text: '<<1, "a", {TRUE}>>', valueClass: "TupleValue" },
  { name: "record", text: "[a |-> 1, b |-> 2]", valueClass: "RecordValue" },
  { name: "record_nested", text: "[a |-> [b |-> <<1>>]]", valueClass: "RecordValue" },
  { name: "bag", text: "SetToBag({1})", valueClass: "FcnRcdValue" },
  { name: "colon_greater", text: "1 :> 2", valueClass: "FcnRcdValue" },
  { name: "double_at", text: "(1 :> 2) @@ (2 :> 3)", valueClass: "FcnRcdValue" },
];

export const SET_VALUES = VALUES.filter((value) =>
  /Set|Interval|Subset|Union|User/.test(value.valueClass),
);

const written = new Set<string>();

export const writeTest = (
  path: string,
  metadata: TestMetadata,
  moduleName: string,
  body: string,
) => {
  const target = join(GENERATED_DIRECTORY, path, `${moduleName}.tla`);
  const module = `---- MODULE ${moduleName} ----\n${body}\n====\n`;
  written.add(target);
  const existing = existsSync(target) ? parseTest(target, readFileSync(target, "utf8")) : undefined;
  const kept = keepCorrection(existing, metadata, module);
  const isUnchanged =
    existing !== undefined &&
    existing.source.endsWith(`---*)\n${module}`) &&
    isDeepStrictEqual(existing.metadata, JSON.parse(JSON.stringify(kept)));
  if (isUnchanged) return;
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, renderTest(kept, module));
};

export const removeStaleTests = () =>
  listFiles(GENERATED_DIRECTORY)
    .filter((path) => !written.has(path))
    .forEach((path) => rmSync(path));

export const writeValueTest = (
  path: string,
  moduleName: string,
  description: string,
  ref: string,
  expression: string,
  isTlcBug = false,
) => {
  const usesModelValue = /\bmv\b/.test(expression);
  writeTest(
    path,
    {
      description,
      ref,
      features: isTlcBug ? ["value-matrix", "tlc-bug"] : ["value-matrix"],
      flags: ["expression"],
      contexts: ["assume"],
      outcome: "any",
      ...(usesModelValue ? { config: "CONSTANT mv = mv\n" } : {}),
    },
    moduleName,
    `EXTENDS ${MODULES}\n${usesModelValue ? "CONSTANT mv\n" : ""}Test == PrintT(${expression})`,
  );
};
