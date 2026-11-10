/*---
description: Ported from TypeScript's tests/cases/compiler/contextualReturnTypeOfIIFE.ts.
outcome: success
source: tests/cases/compiler/contextualReturnTypeOfIIFE.ts
---*/
// @target: es2015
// @lib: esnext

const test1: Promise<[one: number, two: string]> = (async () => {
    return [1, 'two'];
})();

const test2: Promise<[one: number, two: string]> = new Promise(
    (resolve) => resolve([1, 'two']),
);

const obj: { foo: [one: number, two: string] } = {
    foo: (() => [1, 'two'])()
};

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
