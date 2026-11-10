/*---
description: Ported from TypeScript's tests/cases/compiler/classImplementsClass1.ts.
outcome: success
source: tests/cases/compiler/classImplementsClass1.ts
---*/
// @target: es2015
class A { }
class C implements A { }

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
