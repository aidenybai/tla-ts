/*---
description: Ported from TypeScript's tests/cases/compiler/contextualSignatureInObjectFreeze.ts.
outcome: success
source: tests/cases/compiler/contextualSignatureInObjectFreeze.ts
---*/
// #49101
// @target: es2020
// @lib: es2019

Object.freeze({
    f: function () { }
})

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
