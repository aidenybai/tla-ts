/*---
description: Ported from TypeScript's tests/cases/conformance/types/literal/literalTypesAndTypeAssertions.ts.
outcome: success
source: tests/cases/conformance/types/literal/literalTypesAndTypeAssertions.ts
---*/
// @target: es2015
const obj = {
    a: "foo" as "foo",
    b: <"foo">"foo",
    c: "foo"
};

let x1 = 1 as (0 | 1);
let x2 = 1;

let { a = "foo" } = { a: "foo" };
let { b = "foo" as "foo" } = { b: "bar" };
let { c = "foo" } = { c: "bar" as "bar" };
let { d = "foo" as "foo" } = { d: "bar" as "bar" };

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
