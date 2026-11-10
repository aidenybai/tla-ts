/*---
description: Ported from TypeScript's tests/cases/compiler/targetTypingOnFunctions.ts.
outcome: success
source: tests/cases/compiler/targetTypingOnFunctions.ts
---*/
// @target: es2015
var fu: (s: string) => string = function (s) { return s.toLowerCase() };

var zu = fu = function (s) { return s.toLowerCase() };

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
