/*---
description: Ported from TypeScript's tests/cases/compiler/checkSuperCallBeforeThisAccessing4.ts.
outcome: success
source: tests/cases/compiler/checkSuperCallBeforeThisAccessing4.ts
---*/
﻿// @target: es2015
class Based { }
class Derived extends Based {
    public x: number;
    constructor() {
        (() => {
            this;  // No error
        });
        () => {
            this;  // No error
        };
        (() => {
            this;  // No error
        })();
        super();
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
