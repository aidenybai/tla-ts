/*---
description: Ported from TypeScript's tests/cases/compiler/overloadOnConstInheritance3.ts.
outcome: success
source: tests/cases/compiler/overloadOnConstInheritance3.ts
---*/
// @target: es2015
interface Base {
    addEventListener(x: string): any;
}
interface Deriver extends Base {
    // shouldn't need to redeclare the string overload
    addEventListener(x: 'bar'): string;
    addEventListener(x: 'foo'): string;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
