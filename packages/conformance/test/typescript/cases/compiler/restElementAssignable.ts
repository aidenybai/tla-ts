/*---
description: Ported from TypeScript's tests/cases/compiler/restElementAssignable.ts.
outcome: success
source: tests/cases/compiler/restElementAssignable.ts
---*/
// @target: es2015
// @strict: true

{
    const { ...props } = {};
    // Use to fail
    const t1: { [x: symbol]: unknown } = props;
    // Working equivalent
    const t2: { [x: symbol]: unknown } = {};
}

{
    const { ...props } = { a: 1, b: false, c: "str" };
    // Use to fail
    const t1: { [x: string]: number | boolean | string } = props;
    // Working equivalent
    const t2: { [x: string]: number | boolean | string } = { a: 1, b: false, c: "str" };;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
