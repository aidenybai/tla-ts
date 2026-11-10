/*---
description: Ported from TypeScript's tests/cases/compiler/moduleWithTryStatement1.ts.
outcome: success
source: tests/cases/compiler/moduleWithTryStatement1.ts
---*/
// @target: es2015
namespace M {
  try {
  }
  catch (e) {
  }
}
var v = M;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
