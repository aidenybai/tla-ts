/*---
description: Ported from TypeScript's tests/cases/conformance/expressions/optionalChaining/optionalChainingInLoop.ts.
outcome: success
source: tests/cases/conformance/expressions/optionalChaining/optionalChainingInLoop.ts
---*/
// @target: es5, es2015
// @lib: es2015
// @noTypesAndSymbols: true
// https://github.com/microsoft/TypeScript/issues/40643
const list: any[] = []
for (const comp of list) {
    comp.sp.y = comp.sp.r.find((k: any) => k.c == (comp.xp ? '1' : '0'))
    for (const item of comp.c) {
        item.v = !!item.t?.length
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
