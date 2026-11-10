/*---
description: Ported from TypeScript's tests/cases/compiler/preserveConstEnums.ts.
outcome: success
source: tests/cases/compiler/preserveConstEnums.ts
---*/
// @target: es2015
// @preserveConstEnums: true
const enum E {
    Value = 1, Value2 = Value
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
