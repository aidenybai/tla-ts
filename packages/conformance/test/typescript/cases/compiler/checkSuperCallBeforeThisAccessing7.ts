/*---
description: Ported from TypeScript's tests/cases/compiler/checkSuperCallBeforeThisAccessing7.ts.
outcome: success
source: tests/cases/compiler/checkSuperCallBeforeThisAccessing7.ts
---*/
﻿// @target: es2015
class Base {
    constructor(func: ()=>Base) {
    }
}
class Super extends Base {
    constructor() {
        super((() => this)); // No error
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
