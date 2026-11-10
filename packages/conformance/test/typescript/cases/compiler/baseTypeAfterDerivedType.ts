/*---
description: Ported from TypeScript's tests/cases/compiler/baseTypeAfterDerivedType.ts.
outcome: success
source: tests/cases/compiler/baseTypeAfterDerivedType.ts
---*/
// @target: es2015
interface Derived extends Base {
    method(...args: any[]): void;
}

interface Base {
    method(...args: any[]): void;
}

class Derived2 implements Base2 {
    method(...args: any[]): void { }
}

interface Base2 {
    method(...args: any[]): void;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
