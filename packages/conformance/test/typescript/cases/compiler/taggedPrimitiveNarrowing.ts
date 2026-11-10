/*---
description: Ported from TypeScript's tests/cases/compiler/taggedPrimitiveNarrowing.ts.
outcome: success
source: tests/cases/compiler/taggedPrimitiveNarrowing.ts
---*/
// @target: es2015
// @strict: true
// @declaration: true

type Hash = string & { __hash: true };

function getHashLength(hash: Hash): number {
    if (typeof hash !== "string") {
        throw new Error("This doesn't look like a hash");
    }
    return hash.length;
}

function getHashLength2<T extends { __tag__: unknown}>(hash: string & T): number {
    if (typeof hash !== "string") {
        throw new Error("This doesn't look like a hash");
    }
    return hash.length;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
