/*---
description: Ported from TypeScript's tests/cases/compiler/weakTypeAndPrimitiveNarrowing.ts.
outcome: success
source: tests/cases/compiler/weakTypeAndPrimitiveNarrowing.ts
---*/
// @target: es2015
// @strict: true

type LiteralsAndWeakTypes = 
  | 'A'
  | 'B'
  | { optional?: true }
  | { toLowerCase?(): string }
  | { toUpperCase?(): string, otherOptionalProp?: number };

const g = (arg: LiteralsAndWeakTypes) => {
    if (arg === 'A') {
      arg;
    } else {
      arg;
    }
}

type PrimitivesAndWeakTypes =
  | string
  | number
  | { optional?: true }
  | { toLowerCase?(): string }
  | { toUpperCase?(): string, otherOptionalProp?: number };

const h = (arg: PrimitivesAndWeakTypes) => {
    if (arg === 'A') {
      arg;
    } else {
      arg;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
