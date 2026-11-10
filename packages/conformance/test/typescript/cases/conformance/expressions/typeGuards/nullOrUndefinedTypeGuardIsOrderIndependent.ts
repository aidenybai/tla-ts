/*---
description: Ported from TypeScript's tests/cases/conformance/expressions/typeGuards/nullOrUndefinedTypeGuardIsOrderIndependent.ts.
outcome: success
source: tests/cases/conformance/expressions/typeGuards/nullOrUndefinedTypeGuardIsOrderIndependent.ts
---*/
// @target: es2015
// @strictNullChecks: true
function test(strOrNull: string | null, strOrUndefined: string | undefined) {
    var str: string = "original";
    var nil: null;
    if (null === strOrNull) {
        nil = strOrNull;
    }
    else {
        str = strOrNull;
    }
    if (undefined !== strOrUndefined) {
        str = strOrUndefined;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
