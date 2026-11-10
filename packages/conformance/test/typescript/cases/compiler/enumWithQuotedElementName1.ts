/*---
description: Ported from TypeScript's tests/cases/compiler/enumWithQuotedElementName1.ts.
outcome: success
source: tests/cases/compiler/enumWithQuotedElementName1.ts
---*/
// @target: es2015
enum E {
   'fo"o',
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
