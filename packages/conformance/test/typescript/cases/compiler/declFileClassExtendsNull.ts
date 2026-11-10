/*---
description: Ported from TypeScript's tests/cases/compiler/declFileClassExtendsNull.ts.
outcome: success
source: tests/cases/compiler/declFileClassExtendsNull.ts
---*/
// @target: ES5, ES2015
// @declaration: true

class ExtendsNull extends null {
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
