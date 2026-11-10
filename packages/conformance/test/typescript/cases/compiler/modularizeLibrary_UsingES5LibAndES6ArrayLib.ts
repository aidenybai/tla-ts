/*---
description: Ported from TypeScript's tests/cases/compiler/modularizeLibrary_UsingES5LibAndES6ArrayLib.ts.
outcome: success
source: tests/cases/compiler/modularizeLibrary_UsingES5LibAndES6ArrayLib.ts
---*/
﻿// @lib: es5,es2015.core
// @target: es5, es2015

// No error
function f(x: number, y: number, z: number) {
    return Array.from(arguments);
}

f(1, 2, 3);

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
