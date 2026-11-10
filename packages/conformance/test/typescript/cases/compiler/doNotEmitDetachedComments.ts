/*---
description: Ported from TypeScript's tests/cases/compiler/doNotEmitDetachedComments.ts.
outcome: success
source: tests/cases/compiler/doNotEmitDetachedComments.ts
---*/
﻿// @target: es2015
// @removeComments: true
/*

    multi line
    comment
*/

var x = 10;

// Single Line comment

function foo() { }


/*
    multi-line comment

*/


//========================


function bar() { }


//========================

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
