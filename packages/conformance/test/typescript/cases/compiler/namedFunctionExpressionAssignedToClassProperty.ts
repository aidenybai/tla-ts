/*---
description: Ported from TypeScript's tests/cases/compiler/namedFunctionExpressionAssignedToClassProperty.ts.
outcome: success
source: tests/cases/compiler/namedFunctionExpressionAssignedToClassProperty.ts
---*/
// @target: es2015
class Foo{

       a = function bar(){

       }; // this shouldn't crash the compiler...

       

       constructor(){

       }

}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
