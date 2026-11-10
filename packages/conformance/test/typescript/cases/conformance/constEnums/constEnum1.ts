/*---
description: Ported from TypeScript's tests/cases/conformance/constEnums/constEnum1.ts.
outcome: success
source: tests/cases/conformance/constEnums/constEnum1.ts
---*/
﻿// @target: es2015
// @declaration: true

// An enum declaration that specifies a const modifier is a constant enum declaration.
// In a constant enum declaration, all members must have constant values and
// it is an error for a member declaration to specify an expression that isn't classified as a constant enum expression.

const enum E {
    a = 10,
    b = a,
    c = (a+1),
    e,
    d = ~e,
    f = a << 2 >> 1,
    g = a << 2 >>> 1,
    h = a | b
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
