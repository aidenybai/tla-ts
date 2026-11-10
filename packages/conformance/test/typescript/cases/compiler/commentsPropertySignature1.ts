/*---
description: Ported from TypeScript's tests/cases/compiler/commentsPropertySignature1.ts.
outcome: success
source: tests/cases/compiler/commentsPropertySignature1.ts
---*/
// @target: es2015
// @removeComments: false
var a = {
    /** own x*/
    x: 0
};

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
