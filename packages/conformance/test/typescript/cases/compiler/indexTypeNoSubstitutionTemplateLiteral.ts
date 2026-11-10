/*---
description: Ported from TypeScript's tests/cases/compiler/indexTypeNoSubstitutionTemplateLiteral.ts.
outcome: success
source: tests/cases/compiler/indexTypeNoSubstitutionTemplateLiteral.ts
---*/
// @target: es2015
// @strict: true

function Foo() {}
Foo[`b`] = function () {};

type Test = keyof typeof Foo;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
