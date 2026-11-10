/*---
description: Ported from TypeScript's tests/cases/compiler/asyncFunctionWithForStatementNoInitializer.ts.
outcome: success
source: tests/cases/compiler/asyncFunctionWithForStatementNoInitializer.ts
---*/
// @target: es2015
async function test1() {
    let i = 0
    let limit = 10
    for (; i < limit; ++i) {
    }
}

async function test2() {
    let i = 0
    let limit = 10
    for (i = 1; i < limit; ++i) {
    }
}

async function test3() {
    let i = 0
    for (;; ++i) {
    }
}

async function test4() {
    for (;;) {
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
