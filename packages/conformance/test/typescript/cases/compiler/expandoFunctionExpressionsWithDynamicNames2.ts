/*---
description: Ported from TypeScript's tests/cases/compiler/expandoFunctionExpressionsWithDynamicNames2.ts.
outcome: success
source: tests/cases/compiler/expandoFunctionExpressionsWithDynamicNames2.ts
---*/
// @target: es2015
// @strict: true
// @lib: esnext
// @noEmit: true

const mySymbol = Symbol();
interface Foo {
  (): void;
  [mySymbol]: true;
}
const foo: Foo = () => {};
foo[mySymbol] = true;

interface Bar {
  (): void;
  test: true;
}
const t = "test" as const;
const bar: Bar = () => {};
bar[t] = true;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
