/*---
description: Ported from TypeScript's tests/cases/compiler/narrowingTypeofFunction.ts.
outcome: success
source: tests/cases/compiler/narrowingTypeofFunction.ts
---*/
// @target: es2015
// @strict: true

type Meta = { foo: string }
interface F { (): string }

function f1(a: (F & Meta) | string) {
    if (typeof a === "function") {
        a;
    }
    else {
        a;
    }
}

function f2<T>(x: (T & F) | T & string) {
    if (typeof x === "function") {
        x;
    }
    else {
        x;
    }
}

function f3(x: { _foo: number } & number) {
    if (typeof x === "function") {
        x;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
