/*---
description: Ported from TypeScript's tests/cases/compiler/checkSuperCallBeforeThisAccessing3.ts.
outcome: success
source: tests/cases/compiler/checkSuperCallBeforeThisAccessing3.ts
---*/
﻿// @target: es2015
class Based { }
class Derived extends Based {
    public x: number;
    constructor() {
        class innver {
            public y: boolean;
            constructor() {
                this.y = true;
            }
        }
        super();
        this.x = 10;
        var that = this;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
