/*---
description: Ported from TypeScript's tests/cases/compiler/badOverloadError.ts.
outcome: success
source: tests/cases/compiler/badOverloadError.ts
---*/
// @target: es2015
function method() {
    var dictionary = <{ [index: string]: string; }>{};
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
