/*---
description: Ported from TypeScript's tests/cases/compiler/commentOnBlock1.ts.
outcome: success
source: tests/cases/compiler/commentOnBlock1.ts
---*/
// @target: es2015
// asdf
function f() {
 /*asdf*/{}
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
