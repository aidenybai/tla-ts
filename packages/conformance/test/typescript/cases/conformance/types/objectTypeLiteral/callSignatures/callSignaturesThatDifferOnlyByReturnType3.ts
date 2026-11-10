/*---
description: Ported from TypeScript's tests/cases/conformance/types/objectTypeLiteral/callSignatures/callSignaturesThatDifferOnlyByReturnType3.ts.
outcome: success
source: tests/cases/conformance/types/objectTypeLiteral/callSignatures/callSignaturesThatDifferOnlyByReturnType3.ts
---*/
// @target: es2015
// @strict: false
// Normally it is an error to have multiple overloads with identical signatures in a single type declaration.
// Here the multiple overloads come from multiple merged declarations.

interface I {
    (x: string): string;
}

interface I {
    (x: string): number;
}

interface I2<T> {
    (x: string): string;
}

interface I2<T> {
    (x: string): number;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
