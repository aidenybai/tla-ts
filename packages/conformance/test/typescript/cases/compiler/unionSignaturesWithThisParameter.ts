/*---
description: Ported from TypeScript's tests/cases/compiler/unionSignaturesWithThisParameter.ts.
outcome: success
source: tests/cases/compiler/unionSignaturesWithThisParameter.ts
---*/
// @target: es2015
// @strict: true

// Repro from #20802

function x<T>(ctor: {
    (this: {}, v: T): void;
    new(v: T): void;
} | {
    (v: T): void;
    new(v: T): void;
}, t: T) {
    new ctor(t);
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
