/*---
description: Ported from TypeScript's tests/cases/compiler/narrowingTypeofObject.ts.
outcome: success
source: tests/cases/compiler/narrowingTypeofObject.ts
---*/
// @target: es2015
// @strict: true

interface F { (): string }

function test(x: number & { _foo: string }) {
    if (typeof x === 'object') {
        x; 
    }
}

function f1(x: F & { foo: number }) {
    if (typeof x !== "object") {
        x;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
