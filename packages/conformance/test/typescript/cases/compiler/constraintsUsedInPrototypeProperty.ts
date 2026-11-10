/*---
description: Ported from TypeScript's tests/cases/compiler/constraintsUsedInPrototypeProperty.ts.
outcome: success
source: tests/cases/compiler/constraintsUsedInPrototypeProperty.ts
---*/
// @target: es2015
class Foo<T extends number, U, V extends string> { }
Foo.prototype; // Foo<any, any, any>

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
