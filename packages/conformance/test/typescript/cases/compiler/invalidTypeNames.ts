/*---
description: Ported from TypeScript's tests/cases/compiler/invalidTypeNames.ts.
outcome: success
source: tests/cases/compiler/invalidTypeNames.ts
---*/
// @target: es2015
// Refer to calling code - a real illegal name is subbed in here
class illegal_name_here {
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
