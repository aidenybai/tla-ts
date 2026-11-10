/*---
description: Ported from TypeScript's tests/cases/compiler/stringIncludes.ts.
outcome: success
source: tests/cases/compiler/stringIncludes.ts
---*/
//@target: ES6

var includes: boolean;
includes = "abcde".includes("cd");
includes = "abcde".includes("cd", 2);

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
