/*---
description: Ported from TypeScript's tests/cases/compiler/substitutionTypeForIndexedAccessType1.ts.
outcome: success
source: tests/cases/compiler/substitutionTypeForIndexedAccessType1.ts
---*/
// @target: es2015
type AddPropToObject<Obj extends object, Prop extends string> = Prop extends keyof Obj
  ? Obj[Prop] extends unknown[]
    ? [...Obj[Prop]]
    : never
  : never

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
