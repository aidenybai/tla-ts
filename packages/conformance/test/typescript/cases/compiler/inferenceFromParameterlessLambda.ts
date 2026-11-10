/*---
description: Ported from TypeScript's tests/cases/compiler/inferenceFromParameterlessLambda.ts.
outcome: success
source: tests/cases/compiler/inferenceFromParameterlessLambda.ts
---*/
// @target: es2015
function foo<T>(o: Take<T>, i: Make<T>) { }
interface Make<T> {
    (): T;
}
interface Take<T> {
    (n: T): void;
}
// Infer string from second argument because it isn't context sensitive
foo(n => n.length, () => 'hi');

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
