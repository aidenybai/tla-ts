/*---
description: Ported from TypeScript's tests/cases/conformance/externalModules/asiPreventsParsingAsAmbientExternalModule02.ts.
outcome: success
source: tests/cases/conformance/externalModules/asiPreventsParsingAsAmbientExternalModule02.ts
---*/
// @target: es2015

var declare: number;
var module: string;

namespace container {
    declare                // this is the identifier 'declare'
    module                 // this is the identifier 'module'
    "my external module"   // this is just a string
    { }                    // this is a block body
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
