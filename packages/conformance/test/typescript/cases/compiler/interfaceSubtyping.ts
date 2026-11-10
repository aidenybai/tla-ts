/*---
description: Ported from TypeScript's tests/cases/compiler/interfaceSubtyping.ts.
outcome: success
source: tests/cases/compiler/interfaceSubtyping.ts
---*/
// @target: es2015
interface iface {
    foo(): void;
}
class Camera implements iface{
    constructor (public str: string) {
    }
    foo() {  return "s";   }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
