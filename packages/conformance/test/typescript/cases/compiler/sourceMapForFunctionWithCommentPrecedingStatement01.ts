/*---
description: Ported from TypeScript's tests/cases/compiler/sourceMapForFunctionWithCommentPrecedingStatement01.ts.
outcome: success
source: tests/cases/compiler/sourceMapForFunctionWithCommentPrecedingStatement01.ts
---*/
﻿// @target: es2015
//@sourceMap: true
function P() {
    // Test this
    var a = 1;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
