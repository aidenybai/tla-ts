/*---
description: Ported from TypeScript's tests/cases/compiler/objectSpreadWithinMethodWithinObjectWithSpread.ts.
outcome: success
source: tests/cases/compiler/objectSpreadWithinMethodWithinObjectWithSpread.ts
---*/
// @target: es2015
const obj = {};
const a = {
    ...obj,
    prop() {
        return {
            ...obj,
            metadata: 213
        };
    }
};

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
