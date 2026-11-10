/*---
description: Ported from TypeScript's tests/cases/compiler/quotedPropertyName1.ts.
outcome: success
source: tests/cases/compiler/quotedPropertyName1.ts
---*/
// @target: es2015
class Test1 {
  "prop1" = 0;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
