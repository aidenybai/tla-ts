/*---
description: Ported from TypeScript's tests/cases/compiler/functionType.ts.
outcome: success
source: tests/cases/compiler/functionType.ts
---*/
// @target: es2015
function salt() {}
salt.apply("hello", []);
(new Function("return 5"))();

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
