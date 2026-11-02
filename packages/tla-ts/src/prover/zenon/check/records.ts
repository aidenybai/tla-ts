// The checks of the TLA+ extension's rules for tuples and records, after the lemmas in Zenon.thy
// that justify them.

import type { PlainRuleName } from "../proof";
import {
  app,
  domain,
  ensure,
  equal,
  expectApp,
  expectNot,
  fapply,
  getPairs,
  getStringText,
  makeNatural,
  member,
  not,
  type Checker,
  type RuleSpec,
  type SpecTable,
  type Term,
} from "./terms";

// The fields of a record or a set of records, whose labels must be distinct string literals.
export const getFields = (record: Term, constructor: "TLA.record" | "TLA.recordset") => {
  const fields = getPairs(expectApp(record, constructor));
  const labels = fields.map((field) => getStringText(field[0]));
  ensure(new Set(labels).size === labels.length);
  return fields;
};

const getLabels = (fields: [Term, Term][]) =>
  app(
    "TLA.set",
    fields.map((field) => field[0]),
  );

const getRecordInequalitySpec = (formula: Term, isRecordRight: boolean): RuleSpec => {
  const sides = expectApp(expectNot(formula), "=", 2);
  const other = isRecordRight ? sides[0] : sides[1];
  const fields = getFields(isRecordRight ? sides[1] : sides[0], "TLA.record");
  return {
    premises: [formula],
    branches: [
      [not(app("TLA.isAFcn", [other]))],
      [not(equal(domain(other), getLabels(fields)))],
      ...fields.map((field) => [not(equal(fapply(other, field[0]), field[1]))]),
    ],
  };
};

// Checks that the formulas list exactly the expected ones, and returns them as branches.
const expectSameSet = (checker: Checker, given: Term[], expected: Term[]) => {
  const keys = new Set(expected.map(checker.getTopKey));
  ensure(
    given.length === keys.size && given.every((formula) => keys.has(checker.getTopKey(formula))),
  );
  return given.map((formula) => [formula]);
};

export const RECORD_RULES = {
  tuple_eq_match: (args) => {
    const sides = expectApp(args[0], "=", 2);
    const left = expectApp(sides[0], "TLA.tuple");
    const right = expectApp(sides[1], "TLA.tuple");
    ensure(left.length === right.length);
    return {
      premises: [args[0]],
      branches: [left.map((inner, index) => equal(inner, right[index]))],
    };
  },
  tuple_eq_mismatch: (args) => {
    const sides = expectApp(args[0], "=", 2);
    ensure(expectApp(sides[0], "TLA.tuple").length !== expectApp(sides[1], "TLA.tuple").length);
    return { premises: [args[0]], branches: [] };
  },
  in_product: (args) => {
    const sides = expectApp(args[0], "TLA.in", 2);
    const element = sides[0];
    const components = expectApp(expectApp(sides[1], "TLA.Product", 1)[0], "TLA.tuple");
    return {
      premises: [args[0]],
      branches: [
        [
          app("TLA.isASeq", [element]),
          equal(app("TLA.Len", [element]), makeNatural(components.length)),
          ...components.map((inner, index) =>
            member(fapply(element, makeNatural(index + 1)), inner),
          ),
        ],
      ],
    };
  },
  notin_product: (args) => {
    const sides = expectApp(expectNot(args[0]), "TLA.in", 2);
    const element = sides[0];
    const components = expectApp(expectApp(sides[1], "TLA.Product", 1)[0], "TLA.tuple");
    return {
      premises: [args[0]],
      branches: [
        [not(app("TLA.isASeq", [element]))],
        [not(equal(app("TLA.Len", [element]), makeNatural(components.length)))],
        ...components.map((inner, index) => [
          not(member(fapply(element, makeNatural(index + 1)), inner)),
        ]),
      ],
    };
  },
  tuple_notisaseq: (args) => {
    expectApp(expectApp(expectNot(args[0]), "TLA.isASeq", 1)[0], "TLA.tuple");
    return { premises: [args[0]], branches: [] };
  },
  record_eq_match: (args, checker) => {
    const sides = expectApp(args[0], "=", 2);
    const left = getFields(sides[0], "TLA.record");
    const right = getFields(sides[1], "TLA.record");
    const valuesByLabel = new Map(right.map((field) => [getStringText(field[0]), field[1]]));
    const equalities = left.flatMap((field) => {
      const other = valuesByLabel.get(getStringText(field[0]));
      return other === undefined ? [] : [equal(field[1], other)];
    });
    const keys = new Set(equalities.map(checker.getTopKey));
    const given = args.slice(1);
    ensure(given.every((formula) => keys.has(checker.getTopKey(formula))));
    return { premises: [args[0]], branches: [given] };
  },
  record_eq_mismatch: (args) => {
    const sides = expectApp(args[0], "=", 2);
    const leftLabels = getFields(sides[0], "TLA.record").map((field) => getStringText(field[0]));
    const rightLabels = new Set(
      getFields(sides[1], "TLA.record").map((field) => getStringText(field[0])),
    );
    ensure(
      leftLabels.length !== rightLabels.size || leftLabels.some((label) => !rightLabels.has(label)),
    );
    return { premises: [args[0]], branches: [] };
  },
  record_neq_match: (args, checker) => {
    const sides = expectApp(expectNot(args[0]), "=", 2);
    const left = getFields(sides[0], "TLA.record");
    const right = getFields(sides[1], "TLA.record");
    const valuesByLabel = new Map(right.map((field) => [getStringText(field[0]), field[1]]));
    ensure(left.length === right.length);
    const inequalities = left.map((field) => {
      const other = valuesByLabel.get(getStringText(field[0]));
      ensure(other !== undefined);
      return not(equal(field[1], other));
    });
    return {
      premises: [args[0]],
      branches: expectSameSet(checker, args.slice(1), inequalities),
    };
  },
  neq_record: (args) => getRecordInequalitySpec(args[0], true),
  record_neq: (args) => getRecordInequalitySpec(args[0], false),
  in_recordset: (args) => {
    const sides = expectApp(args[0], "TLA.in", 2);
    const element = sides[0];
    const fields = getFields(sides[1], "TLA.recordset");
    return {
      premises: [args[0]],
      branches: [
        [
          app("TLA.isAFcn", [element]),
          equal(domain(element), getLabels(fields)),
          ...fields.map((field) => member(fapply(element, field[0]), field[1])),
        ],
      ],
    };
  },
  notin_recordset: (args) => {
    const sides = expectApp(expectNot(args[0]), "TLA.in", 2);
    const element = sides[0];
    const fields = getFields(sides[1], "TLA.recordset");
    return {
      premises: [args[0]],
      branches: [
        [not(app("TLA.isAFcn", [element]))],
        [not(equal(domain(element), getLabels(fields)))],
        ...fields.map((field) => [not(member(fapply(element, field[0]), field[1]))]),
      ],
    };
  },
  record_notisafcn: (args) => {
    expectApp(expectApp(expectNot(args[0]), "TLA.isAFcn", 1)[0], "TLA.record");
    return { premises: [args[0]], branches: [] };
  },
} satisfies Partial<SpecTable<PlainRuleName>>;
