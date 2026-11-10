/*---
description: Ported from TypeScript's tests/cases/compiler/overloadOnConstInheritance1.ts.
outcome: success
source: tests/cases/compiler/overloadOnConstInheritance1.ts
---*/
// @target: es2015
interface Base {
    addEventListener(x: string): any;
    addEventListener(x: 'foo'): string;
}
interface Deriver extends Base {
    addEventListener(x: string): any;
    addEventListener(x: 'bar'): string;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
