/*---
description: Ported from TypeScript's tests/cases/compiler/quotedFunctionName2.ts.
outcome: success
source: tests/cases/compiler/quotedFunctionName2.ts
---*/
// @target: es2015
class Test1 {
  static "prop1"() { }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
