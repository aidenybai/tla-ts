/*---
description: Ported from TypeScript's tests/cases/conformance/internalModules/moduleDeclarations/asiPreventsParsingAsNamespace03.ts.
outcome: success
source: tests/cases/conformance/internalModules/moduleDeclarations/asiPreventsParsingAsNamespace03.ts
---*/
// @target: es2015

var namespace: number;
var n: string;

namespace container {
    namespace    // this is the identifier 'namespace'
    n            // this is the identifier 'n'
    { }          // this is a block body
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
