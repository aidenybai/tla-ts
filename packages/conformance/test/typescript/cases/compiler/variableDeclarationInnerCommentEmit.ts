/*---
description: Ported from TypeScript's tests/cases/compiler/variableDeclarationInnerCommentEmit.ts.
outcome: success
source: tests/cases/compiler/variableDeclarationInnerCommentEmit.ts
---*/
// @target: es2015
var a = /*some comment*/ null;
var b /*some comment*/ = null;
var /*some comment*/ c = null;

// no space
var a=/*some comment*/null;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
