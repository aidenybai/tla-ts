/*---
description: Ported from TypeScript's tests/cases/compiler/objectLiteralIndexerNoImplicitAny.ts.
outcome: success
source: tests/cases/compiler/objectLiteralIndexerNoImplicitAny.ts
---*/
﻿// @target: es2015
//@noImplicitAny: true
interface I {
    [s: string]: any;
}

var x: I = {
    p: null
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
