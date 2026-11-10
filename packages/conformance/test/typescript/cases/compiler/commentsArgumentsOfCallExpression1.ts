/*---
description: Ported from TypeScript's tests/cases/compiler/commentsArgumentsOfCallExpression1.ts.
outcome: success
source: tests/cases/compiler/commentsArgumentsOfCallExpression1.ts
---*/
﻿// @target: es2015
function foo(/*c1*/ x: any) { }
foo(/*c2*/ 1);
foo(/*c3*/ function () { });
foo(
    /*c4*/
    () => { });
foo(
    /*c5*/
    /*c6*/
    () => { });
foo(/*c7*/
    () => { });
foo(
    /*c7*/
    /*c8*/() => { });

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
