/*---
description: Ported from TypeScript's tests/cases/compiler/parseShortform.ts.
outcome: success
source: tests/cases/compiler/parseShortform.ts
---*/
// @target: es2015
interface I {
    w: {
        z: I;
        (): boolean;
        [s: string]: { x: any; y: any; };
        [n: number]: { x: any; y: any; };
    };
    x: boolean;
    y: (s: string) => boolean;
    z: I; 
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
