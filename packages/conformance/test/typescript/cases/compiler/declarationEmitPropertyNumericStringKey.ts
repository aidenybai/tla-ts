/*---
description: Ported from TypeScript's tests/cases/compiler/declarationEmitPropertyNumericStringKey.ts.
outcome: success
source: tests/cases/compiler/declarationEmitPropertyNumericStringKey.ts
---*/
// @target: es2015
// @declaration: true

// https://github.com/microsoft/TypeScript/issues/55292

const STATUS = {
    ["404"]: "not found",
} as const;

const hundredStr = "100";
const obj = { [hundredStr]: "foo" };

const hundredNum = 100;
const obj2 = { [hundredNum]: "bar" };

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
