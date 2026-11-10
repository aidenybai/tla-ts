/*---
description: Ported from TypeScript's tests/cases/conformance/async/es2017/await_unaryExpression_es2017.ts.
outcome: success
source: tests/cases/conformance/async/es2017/await_unaryExpression_es2017.ts
---*/
﻿// @target: es2017

async function bar() {
    !await 42; // OK
}

async function bar1() {
    +await 42; // OK
}

async function bar3() {
    -await 42; // OK
}

async function bar4() {
    ~await 42; // OK
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
