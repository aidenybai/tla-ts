/*---
description: Ported from TypeScript's tests/cases/compiler/firstMatchRegExpMatchArray.ts.
outcome: success
source: tests/cases/compiler/firstMatchRegExpMatchArray.ts
---*/
// @target: es2015
// @strict: true
// @noUncheckedIndexedAccess: true

const match = ''.match(/ /)

if (match !== null) {
    const foo: string = match[0]
    const bar: string = match[1]
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
