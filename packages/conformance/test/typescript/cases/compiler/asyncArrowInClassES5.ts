/*---
description: Ported from TypeScript's tests/cases/compiler/asyncArrowInClassES5.ts.
outcome: success
source: tests/cases/compiler/asyncArrowInClassES5.ts
---*/
// @noEmitHelpers: true
// @lib: es2015
// @target: es5, es2015
// https://github.com/Microsoft/TypeScript/issues/16924
// Should capture `this`

class Test {
    static member = async (x: string) => { };
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
