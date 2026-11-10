/*---
description: Ported from TypeScript's tests/cases/compiler/sourceMapValidationClassWithDefaultConstructorAndCapturedThisStatement.ts.
outcome: success
source: tests/cases/compiler/sourceMapValidationClassWithDefaultConstructorAndCapturedThisStatement.ts
---*/
// @target: es2015
// @sourcemap: true
class Greeter {
    public a = 10;
    public returnA = () => this.a;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
