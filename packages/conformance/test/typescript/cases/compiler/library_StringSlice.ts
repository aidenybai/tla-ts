/*---
description: Ported from TypeScript's tests/cases/compiler/library_StringSlice.ts.
outcome: success
source: tests/cases/compiler/library_StringSlice.ts
---*/
// @target: es2015
// String.prototype.slice can have zero, one, or two arguments
String.prototype.slice();
String.prototype.slice(0);
String.prototype.slice(0,1);

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
