/*---
description: Ported from TypeScript's tests/cases/conformance/parser/ecmascript5/Generics/parserGenericConstraint1.ts.
outcome: success
source: tests/cases/conformance/parser/ecmascript5/Generics/parserGenericConstraint1.ts
---*/
// @target: es2015
class C<T extends number> {
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
