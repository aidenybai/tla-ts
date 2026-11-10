/*---
description: Ported from TypeScript's tests/cases/compiler/destructuringTempOccursAfterPrologue.ts.
outcome: success
source: tests/cases/compiler/destructuringTempOccursAfterPrologue.ts
---*/
// @target: es2015
function test(p: any) {
    'use strict';
    'use strong';
    p = { prop: p } = p;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
