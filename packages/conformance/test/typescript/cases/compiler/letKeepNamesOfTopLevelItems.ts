/*---
description: Ported from TypeScript's tests/cases/compiler/letKeepNamesOfTopLevelItems.ts.
outcome: success
source: tests/cases/compiler/letKeepNamesOfTopLevelItems.ts
---*/
// @target: es2015
let x;
function foo() {
    let x;
}

namespace A {
    let x;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
