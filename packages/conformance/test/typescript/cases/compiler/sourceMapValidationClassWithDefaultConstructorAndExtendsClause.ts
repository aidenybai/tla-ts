/*---
description: Ported from TypeScript's tests/cases/compiler/sourceMapValidationClassWithDefaultConstructorAndExtendsClause.ts.
outcome: success
source: tests/cases/compiler/sourceMapValidationClassWithDefaultConstructorAndExtendsClause.ts
---*/
// @target: es2015
// @sourcemap: true
class AbstractGreeter {
}

class Greeter extends AbstractGreeter {
    public a = 10;
    public nameA = "Ten";
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
