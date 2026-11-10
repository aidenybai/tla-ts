/*---
description: Ported from TypeScript's tests/cases/compiler/sourceMapForFunctionInInternalModuleWithCommentPrecedingStatement01.ts.
outcome: success
source: tests/cases/compiler/sourceMapForFunctionInInternalModuleWithCommentPrecedingStatement01.ts
---*/
﻿// @target: es2015
//@sourceMap: true
namespace Q {
    function P() {
        // Test this
        var a = 1;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
