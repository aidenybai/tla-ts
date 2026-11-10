/*---
description: Ported from TypeScript's tests/cases/compiler/modularizeLibrary_ErrorFromUsingES6ArrayWithOnlyES6ArrayLib.ts.
outcome: success
source: tests/cases/compiler/modularizeLibrary_ErrorFromUsingES6ArrayWithOnlyES6ArrayLib.ts
---*/
﻿// @lib: es2015.core
// @target: es5, es2015

// Error missing basic JavaScript objects
function f(x: number, y: number, z: number) {
    return Array.from(arguments);
}

f(1, 2, 3);

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
