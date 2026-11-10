/*---
description: Ported from TypeScript's tests/cases/compiler/illegalGenericWrapping1.ts.
outcome: success
source: tests/cases/compiler/illegalGenericWrapping1.ts
---*/
// @target: es2015
interface Sequence<T> {
    each(iterator: (value: T) => void ): void;
    map<U>(iterator: (value: T) => U): Sequence<U>;
    filter(iterator: (value: T) => boolean): Sequence<T>;
    groupBy<K>(keySelector: (value: T) => K): Sequence<{ key: K; items: Sequence<T>; }>;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
