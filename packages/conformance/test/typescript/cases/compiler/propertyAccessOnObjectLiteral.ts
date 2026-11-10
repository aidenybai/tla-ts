/*---
description: Ported from TypeScript's tests/cases/compiler/propertyAccessOnObjectLiteral.ts.
outcome: success
source: tests/cases/compiler/propertyAccessOnObjectLiteral.ts
---*/
// @target: es2015
// @strict: false
class A { }

(<A>{}).toString();

(() => {
    (<A>{}).toString();
})();

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
