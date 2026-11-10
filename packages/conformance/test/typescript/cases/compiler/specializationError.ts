/*---
description: Ported from TypeScript's tests/cases/compiler/specializationError.ts.
outcome: success
source: tests/cases/compiler/specializationError.ts
---*/
// @target: es2015
interface Promise<T> {
    then<U>(value: T): void;
}

interface Bar {
    bar(value: "Menu"): Promise<string>;
    bar<T>(value: string, element: string): Promise<T>;
    bar<T>(value: string): Promise<T>;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
