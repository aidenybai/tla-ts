/*---
description: Ported from TypeScript's tests/cases/conformance/types/typeRelationships/comparable/equalityWithUnionTypes01.ts.
outcome: success
source: tests/cases/conformance/types/typeRelationships/comparable/equalityWithUnionTypes01.ts
---*/
// @target: es2015
interface I1 {
    p1: number
}

interface I2 extends I1 {
    p2: number;
}

var x = { p1: 10, p2: 20 };
var y: number | I2 = x;
var z: I1 = x;

if (y === z || z === y) {
}
else if (y !== z || z !== y) {
}
else if (y == z || z == y) {
}
else if (y != z || z != y) {
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
