/*---
description: Ported from TypeScript's tests/cases/conformance/es6/newTarget/newTargetNarrowing.ts.
outcome: success
source: tests/cases/conformance/es6/newTarget/newTargetNarrowing.ts
---*/
// @target: es6
// @strict: true

function foo(x: true) { }

function f() {
  if (new.target.marked === true) {
    foo(new.target.marked);
  }
}

f.marked = true;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
