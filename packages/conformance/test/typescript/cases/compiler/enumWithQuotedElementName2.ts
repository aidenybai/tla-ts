/*---
description: Ported from TypeScript's tests/cases/compiler/enumWithQuotedElementName2.ts.
outcome: success
source: tests/cases/compiler/enumWithQuotedElementName2.ts
---*/
// @target: es2015
enum E {
   "fo'o",
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
