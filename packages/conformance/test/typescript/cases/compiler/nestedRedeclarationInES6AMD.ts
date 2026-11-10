/*---
description: Ported from TypeScript's tests/cases/compiler/nestedRedeclarationInES6AMD.ts.
outcome: success
source: tests/cases/compiler/nestedRedeclarationInES6AMD.ts
---*/
// @target: ES6
// @module: AMD
function a() {
    {
        let status = 1;
        status = 2;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
