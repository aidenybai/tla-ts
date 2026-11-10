/*---
description: Ported from TypeScript's tests/cases/compiler/classMethodWithKeywordName1.ts.
outcome: success
source: tests/cases/compiler/classMethodWithKeywordName1.ts
---*/
// @target: es2015
class C {
 static try() {}
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
