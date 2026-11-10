/*---
description: Ported from TypeScript's tests/cases/compiler/parenthesizedExpressionInternalComments.ts.
outcome: success
source: tests/cases/compiler/parenthesizedExpressionInternalComments.ts
---*/
// @target: es2015
/*1*/(/*2*/ "foo" /*3*/)/*4*/
;

// open
/*1*/(
    // next
    /*2*/"foo"
    //close
    /*3*/)/*4*/
;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
