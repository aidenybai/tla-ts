/*---
description: Ported from TypeScript's tests/cases/conformance/classes/classDeclarations/classExtendingNull.ts.
outcome: success
source: tests/cases/conformance/classes/classDeclarations/classExtendingNull.ts
---*/
// @target: es2015
class C1 extends null { }
class C2 extends (null) { }
class C3 extends null { x = 1; }
class C4 extends (null) { x = 1; }

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
