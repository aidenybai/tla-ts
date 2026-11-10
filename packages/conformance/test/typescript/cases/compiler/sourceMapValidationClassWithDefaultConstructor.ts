/*---
description: Ported from TypeScript's tests/cases/compiler/sourceMapValidationClassWithDefaultConstructor.ts.
outcome: success
source: tests/cases/compiler/sourceMapValidationClassWithDefaultConstructor.ts
---*/
// @target: es2015
// @sourcemap: true
class Greeter {
    public a = 10;
    public nameA = "Ten";
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
