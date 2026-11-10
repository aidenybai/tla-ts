/*---
description: Ported from TypeScript's tests/cases/compiler/noCircularitySelfReferentialGetter4.ts.
outcome: success
source: tests/cases/compiler/noCircularitySelfReferentialGetter4.ts
---*/
// @target: es2015
// @strict: true
// @noEmit: true

const a = {
  prop: 42,
  get self() {
    return a;
  },
} satisfies { prop: number; self: any };

const prop = a.self.self.self.self.self.prop;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
