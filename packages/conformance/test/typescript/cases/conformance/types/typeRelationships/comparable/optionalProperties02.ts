/*---
description: Ported from TypeScript's tests/cases/conformance/types/typeRelationships/comparable/optionalProperties02.ts.
outcome: success
source: tests/cases/conformance/types/typeRelationships/comparable/optionalProperties02.ts
---*/
// @target: es2015
// @strictNullChecks: true
// @declaration: true

interface Foo {
    a?: string;
    b: string;
}

<Foo>{ a: undefined };

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
