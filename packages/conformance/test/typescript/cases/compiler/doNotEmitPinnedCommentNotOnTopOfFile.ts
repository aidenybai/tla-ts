/*---
description: Ported from TypeScript's tests/cases/compiler/doNotEmitPinnedCommentNotOnTopOfFile.ts.
outcome: success
source: tests/cases/compiler/doNotEmitPinnedCommentNotOnTopOfFile.ts
---*/
﻿// @target: es2015
// @removeComments: true
var x = 10;

/*!

    multi line
    comment
*/

var x = 10;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
