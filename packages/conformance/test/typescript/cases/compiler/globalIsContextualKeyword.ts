/*---
description: Ported from TypeScript's tests/cases/compiler/globalIsContextualKeyword.ts.
outcome: success
source: tests/cases/compiler/globalIsContextualKeyword.ts
---*/
// @target: es2015
function a() {
    let global = 1;
}
function b() {
    class global {}
}

namespace global {
}

function foo(global: number) {
}

let obj = {
    global: "123"
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
