/*---
description: Ported from TypeScript's tests/cases/compiler/objectLiteralWithGetAccessorInsideFunction.ts.
outcome: success
source: tests/cases/compiler/objectLiteralWithGetAccessorInsideFunction.ts
---*/
// @target: es2015
function bar() {
    var x = {
        get _extraOccluded() {
            var occluded = 0;
            return occluded;
        },
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
