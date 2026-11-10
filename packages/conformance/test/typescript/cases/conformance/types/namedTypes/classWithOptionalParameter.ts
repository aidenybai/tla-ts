/*---
description: Ported from TypeScript's tests/cases/conformance/types/namedTypes/classWithOptionalParameter.ts.
outcome: success
source: tests/cases/conformance/types/namedTypes/classWithOptionalParameter.ts
---*/
// @target: es2015
// classes do not permit optional parameters, these are errors

class C {
    x?: string;
    f?() {}
}

class C2<T> {
    x?: T;
    f?(x: T) {}
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
