/*---
description: Ported from TypeScript's tests/cases/compiler/doNotEmitDetachedCommentsAtStartOfLambdaFunction.ts.
outcome: success
source: tests/cases/compiler/doNotEmitDetachedCommentsAtStartOfLambdaFunction.ts
---*/
﻿// @target: es2015
// @removeComments: true
() => {
    // Single line comment

    return 0;
}

() => {
    /*
        multi-line comment
    */

    return 0;
}

() => {
    // Single line comment with more than one blank line


    return 0;
}

() => {
    /*
        multi-line comment with more than one blank line
    */


    return 0;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
