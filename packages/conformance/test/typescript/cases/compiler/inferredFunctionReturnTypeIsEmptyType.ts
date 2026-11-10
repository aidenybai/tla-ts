/*---
description: Ported from TypeScript's tests/cases/compiler/inferredFunctionReturnTypeIsEmptyType.ts.
outcome: success
source: tests/cases/compiler/inferredFunctionReturnTypeIsEmptyType.ts
---*/
// @target: es2015
// @allowUnreachableCode: true

function foo() {
    if (true) {
        return 42;
    }
    else {
        return "42";
    }
};

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
