/*---
description: Ported from TypeScript's tests/cases/conformance/types/objectTypeLiteral/callSignatures/identicalCallSignatures2.ts.
outcome: success
source: tests/cases/conformance/types/objectTypeLiteral/callSignatures/identicalCallSignatures2.ts
---*/
// @target: es2015
// @strict: false
// Normally it is an error to have multiple overloads with identical signatures in a single type declaration.
// Here the multiple overloads come from multiple bases.

interface Base<T> {
    (x: number): string;
}

interface I extends Base<string>, Base<number> { }

interface I2<T> extends Base<string>, Base<number> { }

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
