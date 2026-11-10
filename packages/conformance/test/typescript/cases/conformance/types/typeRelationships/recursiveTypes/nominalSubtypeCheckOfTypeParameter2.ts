/*---
description: Ported from TypeScript's tests/cases/conformance/types/typeRelationships/recursiveTypes/nominalSubtypeCheckOfTypeParameter2.ts.
outcome: success
source: tests/cases/conformance/types/typeRelationships/recursiveTypes/nominalSubtypeCheckOfTypeParameter2.ts
---*/
// @target: es2015
interface B<T> {
    bar: T;
}

// ok
interface A<T> extends B<T> {
    foo: T;
}

// ok
interface A2<T> extends B<B<string>> {
    baz: T;
}

interface C<T> {
    bam: T;
}

// ok
interface A3<T> extends B<C<T>> {
    bing: T;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
