/*---
description: Ported from TypeScript's tests/cases/conformance/async/es6/await_unaryExpression_es6.ts.
outcome: success
source: tests/cases/conformance/async/es6/await_unaryExpression_es6.ts
---*/
﻿// @target: es6

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
