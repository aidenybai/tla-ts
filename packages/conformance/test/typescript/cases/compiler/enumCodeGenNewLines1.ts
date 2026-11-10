/*---
description: Ported from TypeScript's tests/cases/compiler/enumCodeGenNewLines1.ts.
outcome: success
source: tests/cases/compiler/enumCodeGenNewLines1.ts
---*/
// @target: es2015
enum foo {
  b = 1,
  c = 2,
  d = 3
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
