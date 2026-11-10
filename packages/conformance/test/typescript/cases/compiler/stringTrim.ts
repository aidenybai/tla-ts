/*---
description: Ported from TypeScript's tests/cases/compiler/stringTrim.ts.
outcome: success
source: tests/cases/compiler/stringTrim.ts
---*/
// @target: es2019

var trimmed: string;
trimmed = "abcde".trimEnd();
trimmed = "abcde".trimStart();
trimmed = "abcde".trimLeft();
trimmed = "abcde".trimRight();

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
