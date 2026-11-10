/*---
description: Ported from TypeScript's tests/cases/compiler/library_ArraySlice.ts.
outcome: success
source: tests/cases/compiler/library_ArraySlice.ts
---*/
// @target: es2015
// Array.prototype.slice can have zero, one, or two arguments
Array.prototype.slice();
Array.prototype.slice(0);
Array.prototype.slice(0, 1);

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
