/*---
description: Ported from TypeScript's tests/cases/compiler/alwaysStrictAlreadyUseStrict.ts.
outcome: success
source: tests/cases/compiler/alwaysStrictAlreadyUseStrict.ts
---*/
// @target: es2015
// @alwaysStrict: true
"use strict"
function f() {
    var a = [];
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
