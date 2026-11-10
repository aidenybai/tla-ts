/*---
description: Ported from TypeScript's tests/cases/compiler/infinitelyExpandingTypes5.ts.
outcome: success
source: tests/cases/compiler/infinitelyExpandingTypes5.ts
---*/
// @target: es2015
interface Query<T> {
    foo(x: T): Query<T[]>;
}

interface Enumerator<T> {
    (action: (item: T, index: number) => boolean): boolean;
}

function from<T>(array: T[]): Query<T>;
function from<T>(enumerator: Enumerator<T>): Query<T>;
function from(arg: any): any {
    return undefined;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
