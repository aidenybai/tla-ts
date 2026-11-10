/*---
description: Ported from TypeScript's tests/cases/conformance/classes/members/classTypes/indexersInClassType.ts.
outcome: success
source: tests/cases/conformance/classes/members/classTypes/indexersInClassType.ts
---*/
// @target: es2015
class C {
    [x: number]: Date;
    [x: string]: Object;
    1: Date;
    'a': {}

    fn() {
        return this;
    }
}

var c = new C();
var r = c.fn();
var r2 = r[1];
var r3 = r.a

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
