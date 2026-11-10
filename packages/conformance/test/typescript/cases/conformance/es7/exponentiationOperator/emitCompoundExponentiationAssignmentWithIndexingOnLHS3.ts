/*---
description: Ported from TypeScript's tests/cases/conformance/es7/exponentiationOperator/emitCompoundExponentiationAssignmentWithIndexingOnLHS3.ts.
outcome: success
source: tests/cases/conformance/es7/exponentiationOperator/emitCompoundExponentiationAssignmentWithIndexingOnLHS3.ts
---*/
﻿// @target: es5, es2015

var object = {
    _0: 2,
    get 0() {
        return this._0;
    },
    set 0(x: number) {
        this._0 = x;
    },
}
object[0] **= object[0];
object[0] **= object[0] **= 2;
object[0] **= object[0] ** 2;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
