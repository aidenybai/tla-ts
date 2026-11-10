/*---
description: Ported from TypeScript's tests/cases/compiler/relatedViaDiscriminatedTypeNoError.ts.
outcome: success
source: tests/cases/compiler/relatedViaDiscriminatedTypeNoError.ts
---*/
// @target: es2015
class Model {
    constructor(public flag: boolean) {}
}

type DiscriminatedUnion = { flag: true } | { flag: false };
class A<T extends DiscriminatedUnion> {
    constructor(public model: T) { }
}

class B extends A<Model> { }

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
