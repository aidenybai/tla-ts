/*---
description: Ported from TypeScript's tests/cases/conformance/types/thisType/contextualThisType.ts.
outcome: success
source: tests/cases/conformance/types/thisType/contextualThisType.ts
---*/
// @target: es2015
interface X {
    a: (p: this) => this;
}

interface Y extends X {
}

var x: Y = {
    a(p) {
        return p;
    }
}

var y = x.a(x);

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
