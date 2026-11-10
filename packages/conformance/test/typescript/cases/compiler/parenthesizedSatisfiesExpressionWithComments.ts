/*---
description: Ported from TypeScript's tests/cases/compiler/parenthesizedSatisfiesExpressionWithComments.ts.
outcome: success
source: tests/cases/compiler/parenthesizedSatisfiesExpressionWithComments.ts
---*/
// @target: es2015
"use strict";
// @removeComments: false
const a = (/*comm*/ 10 satisfies number);
const b = ((/*comm*/ 10 satisfies number));

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
