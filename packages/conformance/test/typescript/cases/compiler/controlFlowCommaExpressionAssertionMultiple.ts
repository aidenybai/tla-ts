/*---
description: Ported from TypeScript's tests/cases/compiler/controlFlowCommaExpressionAssertionMultiple.ts.
outcome: success
source: tests/cases/compiler/controlFlowCommaExpressionAssertionMultiple.ts
---*/
// @target: es2015
function Narrow<T>(value: any): asserts value is T {}

function func(foo: any, bar: any) {
    Narrow<number>(foo), Narrow<string>(bar);
    foo;
    bar;
}

function func2(foo: any, bar: any, baz: any) {
    Narrow<number>(foo), Narrow<string>(bar), Narrow<boolean>(baz);
    foo;
    bar;
    baz;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
