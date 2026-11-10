/*---
description: Ported from TypeScript's tests/cases/compiler/modKeyword.ts.
outcome: throws
source: tests/cases/compiler/modKeyword.ts
---*/
// @target: es2015
var module:any;
var foo:any;

var _ = module.exports = foo

/*--- recorded
all:
  exit: 1
  transcript: throws
---*/
