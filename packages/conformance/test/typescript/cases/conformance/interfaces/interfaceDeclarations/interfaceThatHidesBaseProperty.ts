/*---
description: Ported from TypeScript's tests/cases/conformance/interfaces/interfaceDeclarations/interfaceThatHidesBaseProperty.ts.
outcome: success
source: tests/cases/conformance/interfaces/interfaceDeclarations/interfaceThatHidesBaseProperty.ts
---*/
// @target: es2015
interface Base {
    x: { a: number };
}

interface Derived extends Base {
    x: {
        a: number; b: number;
    };
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
