/*---
description: Ported from TypeScript's tests/cases/compiler/catch.ts.
outcome: success
source: tests/cases/compiler/catch.ts
---*/
// @target: es2015
function f() {
    try {} catch(e) { }
    try {} catch(e) { }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
