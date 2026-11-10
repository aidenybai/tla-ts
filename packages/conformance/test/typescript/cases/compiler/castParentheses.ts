/*---
description: Ported from TypeScript's tests/cases/compiler/castParentheses.ts.
outcome: throws
source: tests/cases/compiler/castParentheses.ts
---*/
﻿// @target: es2015
class a {
    static b: any;
}

var b = (<any>a);
var b = (<any>a).b;
var b = (<any>a.b).c;
var b = (<any>a.b()).c;
var b = (<any>new a);
var b = (<any>new a.b);
var b = (<any>new a).b

/*--- recorded
all:
  exit: 1
  transcript: throws
---*/
