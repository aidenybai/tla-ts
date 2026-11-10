/*---
description: Ported from TypeScript's tests/cases/compiler/callSignatureFunctionOverload.ts.
outcome: success
source: tests/cases/compiler/callSignatureFunctionOverload.ts
---*/
// @target: es2015
var foo: {
    (name: string): string;
    (name: 'order'): string;
    (name: 'content'): string;
    (name: 'done'): string;
}

var foo2: {
    (name: string): string;
    (name: 'order'): string;
    (name: 'order'): string;
    (name: 'done'): string;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
