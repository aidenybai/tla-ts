/*---
description: Ported from TypeScript's tests/cases/compiler/declFileForFunctionTypeAsTypeParameter.ts.
outcome: success
source: tests/cases/compiler/declFileForFunctionTypeAsTypeParameter.ts
---*/
// @target: es2015
// @declaration: true

class X<T> {
}
class C extends X<() => number> {
}
interface I extends X<() => number> {
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
