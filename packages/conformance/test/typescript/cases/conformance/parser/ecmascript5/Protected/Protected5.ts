/*---
description: Ported from TypeScript's tests/cases/conformance/parser/ecmascript5/Protected/Protected5.ts.
outcome: success
source: tests/cases/conformance/parser/ecmascript5/Protected/Protected5.ts
---*/
// @target: es2015
class C {
  protected static m() { }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
