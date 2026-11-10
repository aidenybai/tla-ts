/*---
description: Ported from TypeScript's tests/cases/compiler/doNotEmitPinnedDetachedComments.ts.
outcome: success
source: tests/cases/compiler/doNotEmitPinnedDetachedComments.ts
---*/
﻿// @target: es2015
// @removeComments: true
var x = 10;

/*! Single Line comment */

function baz() { }


/*!
    multi-line comment

*/


//========================


function bar() {
    /*!
        Remove this comment
    */

}

function foo() {
    /*! Remove this */

    return 0;
}


//========================

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
