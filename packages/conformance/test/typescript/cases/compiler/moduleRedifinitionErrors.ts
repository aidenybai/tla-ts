/*---
description: Ported from TypeScript's tests/cases/compiler/moduleRedifinitionErrors.ts.
outcome: success
source: tests/cases/compiler/moduleRedifinitionErrors.ts
---*/
// @target: es2015
class A {
}
namespace A {
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
