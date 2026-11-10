/*---
description: Ported from TypeScript's tests/cases/compiler/jsdocCastCommentEmit.ts.
outcome: success
source: tests/cases/compiler/jsdocCastCommentEmit.ts
---*/
// @target: es2015
// allowJs: true
// checkJs: true
// outDir: out/
// filename: input.js
function f() {
    return /* @type {number} */ 42;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
