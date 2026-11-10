/*---
description: Ported from TypeScript's tests/cases/compiler/elementAccessExpressionInternalComments.ts.
outcome: success
source: tests/cases/compiler/elementAccessExpressionInternalComments.ts
---*/
// @target: es2015
/*0*/ Array /*1*/[ /*2*/ "toString" /*3*/ ] /*4*/; /*5*/

/*0*/ Array 
    // single line
    /*1*/[ /*2*/ "toString"
    // single line
    /*3*/ ] /*4*/

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
