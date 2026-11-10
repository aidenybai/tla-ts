/*---
description: Ported from TypeScript's tests/cases/compiler/useDefineForClassFieldsFlagDefault.ts.
outcome: success
source: tests/cases/compiler/useDefineForClassFieldsFlagDefault.ts
---*/
// @target: esNext,es2020

class Foo {
    // For esNext should be emitted 'as is' because useDefineForClassFields defaults to true 
    // For es2020 should be emitted as an assignment after the class definition (not Object.defineProperty) because useDefineForClassFields defaults to false
    static x = 1; 
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
