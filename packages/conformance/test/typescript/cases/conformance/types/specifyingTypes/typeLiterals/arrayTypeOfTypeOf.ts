/*---
description: Ported from TypeScript's tests/cases/conformance/types/specifyingTypes/typeLiterals/arrayTypeOfTypeOf.ts.
outcome: success
source: tests/cases/conformance/types/specifyingTypes/typeLiterals/arrayTypeOfTypeOf.ts
---*/
// @target: es2015
// array type cannot use typeof.

var x = 1;
var xs: typeof x[];  // Not an error.  This is equivalent to Array<typeof x>
var xs2: typeof Array;
var xs3: typeof Array<number>;
var xs4: typeof Array<typeof x>;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
