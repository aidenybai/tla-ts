/*---
description: Ported from TypeScript's tests/cases/conformance/classes/classExpression.ts.
outcome: success
source: tests/cases/conformance/classes/classExpression.ts
---*/
// @target: es2015
var x = class C {
}

var y = {
    foo: class C2 {
    }
}

namespace M {
    var z = class C4 {
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
