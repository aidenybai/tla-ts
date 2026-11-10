/*---
description: Ported from TypeScript's tests/cases/compiler/excessPropertyCheckWithNestedArrayIntersection.ts.
outcome: success
source: tests/cases/compiler/excessPropertyCheckWithNestedArrayIntersection.ts
---*/
// @target: es2015
interface ValueOnlyFields {
    fields: Array<{
        value: number | null;
    }>;
}
interface ValueAndKeyFields {
    fields: Array<{
        key: string | null;
        value: number | null;
    }>;
}
interface BugRepro {
  dataType: ValueAndKeyFields & ValueOnlyFields;
}
const repro: BugRepro = {
  dataType: {
    fields: [{
      key: 'bla', // should be OK: Not excess
      value: null,
    }],
  }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
