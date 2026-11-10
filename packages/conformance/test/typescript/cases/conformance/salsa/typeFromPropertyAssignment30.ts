/*---
description: Ported from TypeScript's tests/cases/conformance/salsa/typeFromPropertyAssignment30.ts.
outcome: success
source: tests/cases/conformance/salsa/typeFromPropertyAssignment30.ts
---*/
// @target: es2015
// @strict: false
interface Combo {
    (): number;
    p?: { [s: string]: number };
}
const c: Combo = () => 1
// should not be an expando object, but contextually typed by Combo.p
c.p = {}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
