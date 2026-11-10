/*---
description: Ported from TypeScript's tests/cases/compiler/constructorParametersThatShadowExternalNamesInVariableDeclarations.ts.
outcome: success
source: tests/cases/compiler/constructorParametersThatShadowExternalNamesInVariableDeclarations.ts
---*/
// @target: es2015
var x = 1;
class A {
    private a = x;
    constructor(x: number) {
    }
}

class B {
    private a = x;
    constructor() {
        var x = "";
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
