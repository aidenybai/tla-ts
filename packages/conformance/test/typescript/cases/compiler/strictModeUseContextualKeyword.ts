/*---
description: Ported from TypeScript's tests/cases/compiler/strictModeUseContextualKeyword.ts.
outcome: success
source: tests/cases/compiler/strictModeUseContextualKeyword.ts
---*/
﻿// @target: es2015
"use strict"
var as = 0;
function foo(as: string) { }
class C {
    public as() { }
}
function F() {
    function as() { }
}
function H() {
    let {as} = { as: 1 };
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
