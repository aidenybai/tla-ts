/*---
description: Ported from TypeScript's tests/cases/compiler/recursiveReverseMappedType.ts.
outcome: success
source: tests/cases/compiler/recursiveReverseMappedType.ts
---*/
// @target: es2015
// @strict: true

// Repro from #38198

type Recur<T> = (
    T extends (unknown[]) ? {} : { [K in keyof T]?: Recur<T[K]> }
) | ['marker', ...Recur<T>[]];

function join<T>(l: Recur<T>[]): Recur<T> {
    return ['marker', ...l];
}

function a<T>(l: Recur<T>[]): void {
    const x: Recur<T> | undefined = join(l);
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
