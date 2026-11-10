/*---
description: Ported from TypeScript's tests/cases/compiler/nestedModulePrivateAccess.ts.
outcome: success
source: tests/cases/compiler/nestedModulePrivateAccess.ts
---*/
// @target: es2015
namespace a{
       var x:number;
       namespace b{
               var y = x; // should not be an error
       }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
