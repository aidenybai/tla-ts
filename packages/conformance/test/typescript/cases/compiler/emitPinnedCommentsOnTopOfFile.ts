/*---
description: Ported from TypeScript's tests/cases/compiler/emitPinnedCommentsOnTopOfFile.ts.
outcome: success
source: tests/cases/compiler/emitPinnedCommentsOnTopOfFile.ts
---*/
﻿// @target: es2015
// @removeComments: true
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
