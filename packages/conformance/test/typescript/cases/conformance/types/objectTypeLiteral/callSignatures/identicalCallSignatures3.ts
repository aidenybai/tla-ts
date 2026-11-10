/*---
description: Ported from TypeScript's tests/cases/conformance/types/objectTypeLiteral/callSignatures/identicalCallSignatures3.ts.
outcome: success
source: tests/cases/conformance/types/objectTypeLiteral/callSignatures/identicalCallSignatures3.ts
---*/
// @target: es2015
// @strict: false
// Normally it is an error to have multiple overloads with identical signatures in a single type declaration.
// Here the multiple overloads come from multiple merged declarations, so we do not report errors.

interface I {
    (x: number): string;
}

interface I {
    (x: number): string;
}

interface I2<T> {
    (x: number): string;
}

interface I2<T> {
    (x: number): string;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
