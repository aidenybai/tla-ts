/*---
description: Ported from TypeScript's tests/cases/compiler/genericWithIndexerOfTypeParameterType1.ts.
outcome: success
source: tests/cases/compiler/genericWithIndexerOfTypeParameterType1.ts
---*/
// @target: es2015
class LazyArray<T> {
    private objects = <{ [objectId: string]: T; }>{};
    array() {
        return this.objects;
    }
}
var lazyArray = new LazyArray<string>();
var value: string = lazyArray.array()["test"]; // used to be an error

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
