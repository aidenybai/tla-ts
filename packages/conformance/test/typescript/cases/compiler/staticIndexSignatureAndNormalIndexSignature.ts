/*---
description: Ported from TypeScript's tests/cases/compiler/staticIndexSignatureAndNormalIndexSignature.ts.
outcome: success
source: tests/cases/compiler/staticIndexSignatureAndNormalIndexSignature.ts
---*/
// @target: es2015
class Foo {
    [p: string]: any;
    static [p: string]: number;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
