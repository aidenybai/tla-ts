/*---
description: Ported from TypeScript's tests/cases/compiler/optionsCompositeWithIncrementalFalse.ts.
outcome: success
source: tests/cases/compiler/optionsCompositeWithIncrementalFalse.ts
---*/
// @target: es2015
// @composite: true
// @incremental: false

const x = "Hello World";

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
