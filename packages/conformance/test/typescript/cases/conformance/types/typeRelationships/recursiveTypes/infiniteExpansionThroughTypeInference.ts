/*---
description: Ported from TypeScript's tests/cases/conformance/types/typeRelationships/recursiveTypes/infiniteExpansionThroughTypeInference.ts.
outcome: success
source: tests/cases/conformance/types/typeRelationships/recursiveTypes/infiniteExpansionThroughTypeInference.ts
---*/
// @target: es2015
interface G<T> {
    x: G<G<T>> // infinitely expanding type reference
    y: T
}

function ff<T>(g: G<T>): void {
    ff(g) // when infering T here we need to make sure to not descend into the structure of G<T> infinitely
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
