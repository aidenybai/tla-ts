/*---
description: Ported from TypeScript's tests/cases/compiler/simpleRecursionWithBaseCase3.ts.
outcome: success
source: tests/cases/compiler/simpleRecursionWithBaseCase3.ts
---*/
// @target: es2015
// @strict: true
// @noImplicitAny: true
// @lib: esnext
// @noEmit: true

const fn1 = () => {
  if (Math.random() > 0.5) {
    return fn1()
  }
  return 0
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
