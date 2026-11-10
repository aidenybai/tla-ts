/*---
description: Ported from TypeScript's tests/cases/compiler/interfacePropertiesWithSameName1.ts.
outcome: success
source: tests/cases/compiler/interfacePropertiesWithSameName1.ts
---*/
// @target: es2015
interface Mover {
    move(): void;
    getStatus(): { speed: number; };
}
interface Shaker {
    shake(): void;
    getStatus(): { frequency: number; };
}

interface MoverShaker extends Mover, Shaker {
    getStatus(): { speed: number; frequency: number; };
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
