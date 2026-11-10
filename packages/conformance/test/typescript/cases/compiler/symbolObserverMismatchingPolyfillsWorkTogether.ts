/*---
description: Ported from TypeScript's tests/cases/compiler/symbolObserverMismatchingPolyfillsWorkTogether.ts.
outcome: success
source: tests/cases/compiler/symbolObserverMismatchingPolyfillsWorkTogether.ts
---*/
// @declaration: true
// @target: es6
interface SymbolConstructor {
    readonly observer: symbol;
}
interface SymbolConstructor {
    readonly observer: unique symbol;
}

const obj = {
    [Symbol.observer]: 0
};

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
