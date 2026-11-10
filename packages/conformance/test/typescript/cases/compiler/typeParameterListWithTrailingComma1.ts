/*---
description: Ported from TypeScript's tests/cases/compiler/typeParameterListWithTrailingComma1.ts.
outcome: success
source: tests/cases/compiler/typeParameterListWithTrailingComma1.ts
---*/
// @target: es2015
class C<T,> {
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
