/*---
description: Ported from TypeScript's tests/cases/compiler/sourceMapValidationFunctionExpressions.ts.
outcome: success
source: tests/cases/compiler/sourceMapValidationFunctionExpressions.ts
---*/
// @target: es2015
// @sourcemap: true
var greetings = 0;
var greet = (greeting: string): number => {
    greetings++;
    return greetings;
}
greet("Hello");
var incrGreetings = () => greetings++;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
