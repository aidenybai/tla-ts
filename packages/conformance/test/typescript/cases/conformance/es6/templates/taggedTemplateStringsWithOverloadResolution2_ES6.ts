/*---
description: Ported from TypeScript's tests/cases/conformance/es6/templates/taggedTemplateStringsWithOverloadResolution2_ES6.ts.
outcome: success
source: tests/cases/conformance/es6/templates/taggedTemplateStringsWithOverloadResolution2_ES6.ts
---*/
﻿//@target: es6
function foo1(strs: TemplateStringsArray, x: number): string;
function foo1(strs: string[], x: number): number;
function foo1(...stuff: any[]): any {
    return undefined;
}

var a = foo1 `${1}`;
var b = foo1([], 1);

function foo2(strs: string[], x: number): number;
function foo2(strs: TemplateStringsArray, x: number): string;
function foo2(...stuff: any[]): any {
    return undefined;
}

var c = foo2 `${1}`;
var d = foo2([], 1);

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
