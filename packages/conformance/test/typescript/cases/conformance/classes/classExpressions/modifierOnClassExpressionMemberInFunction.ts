/*---
description: Ported from TypeScript's tests/cases/conformance/classes/classExpressions/modifierOnClassExpressionMemberInFunction.ts.
outcome: success
source: tests/cases/conformance/classes/classExpressions/modifierOnClassExpressionMemberInFunction.ts
---*/
﻿// @target: es2015
// @declaration: true
// @declaration: true

function g() {
    var x = class C {
        public prop1 = 1;
        private foo() { }
        static prop2 = 43;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
