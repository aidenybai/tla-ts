/*---
description: Ported from TypeScript's tests/cases/compiler/deferredTypeReferenceWithinArrayWithinTuple.ts.
outcome: success
source: tests/cases/compiler/deferredTypeReferenceWithinArrayWithinTuple.ts
---*/
// @target: es2015
type TypeStructure =
  | ["or", TypeStructure[]] // problem is only here, when using array
  | ["string"]
  | ["number"] 
  | ["list", TypeStructure] // with just this it is ok

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
