/*---
description: Ported from TypeScript's tests/cases/conformance/expressions/typeSatisfaction/typeSatisfaction_contextualTyping3.ts.
outcome: success
source: tests/cases/conformance/expressions/typeSatisfaction/typeSatisfaction_contextualTyping3.ts
---*/
// @target: es2015
// @strict: true
// @noEmit: true

// see https://github.com/microsoft/TypeScript/issues/53920#issuecomment-1516616255

const obj = {
   foo: (param = "default") => param,
} satisfies {
   [key: string]: (...params: any) => any;
};

const obj2 = {
   foo: (param = "default") => param,
} satisfies {
   [key: string]: Function;
};

type StringOrNumberFunc = (x: string | number) => any;

const fn = ((x = "ok") => null) satisfies StringOrNumberFunc;
fn();
fn(32);

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
