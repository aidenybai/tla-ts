/*---
description: Ported from TypeScript's tests/cases/compiler/destructuredMaappedTypeIsNotImplicitlyAny.ts.
outcome: success
source: tests/cases/compiler/destructuredMaappedTypeIsNotImplicitlyAny.ts
---*/
// @target: es2015
// @noImplicitAny: true
function foo<T extends string>(key: T, obj: { [_ in T]: number }) {
    const { [key]: bar } = obj; // Element implicitly has an 'any' type because type '{ [_ in T]: number; }' has no index signature.
    bar; // bar : any

    // Note: this does work:
    const lorem = obj[key];
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
