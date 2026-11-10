/*---
description: Ported from TypeScript's tests/cases/conformance/types/objectTypeLiteral/objectTypeLiteralSyntax.ts.
outcome: success
source: tests/cases/conformance/types/objectTypeLiteral/objectTypeLiteralSyntax.ts
---*/
// @target: es2015
var x: {
    foo: string;
    bar: string;
}

var y: {
    foo: string;
    bar: string
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
