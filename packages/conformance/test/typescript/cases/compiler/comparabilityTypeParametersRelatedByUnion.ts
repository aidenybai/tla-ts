/*---
description: Ported from TypeScript's tests/cases/compiler/comparabilityTypeParametersRelatedByUnion.ts.
outcome: success
source: tests/cases/compiler/comparabilityTypeParametersRelatedByUnion.ts
---*/
// @target: es2015
class C<T> {
  constructor(readonly x: T) {}

  good<U extends T>(y: U) {
      if (y === this.x) {}
  }

  bad<U extends T | string>(y: U) {
      if (y === this.x) {}
  }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
