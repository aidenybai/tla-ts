/*---
description: Ported from TypeScript's tests/cases/conformance/es6/destructuring/destructuringParameterDeclaration7ES5iterable.ts.
outcome: success
source: tests/cases/conformance/es6/destructuring/destructuringParameterDeclaration7ES5iterable.ts
---*/
﻿// @target: es5, es2015
// @downlevelIteration: true

interface ISomething {
    foo: string,
    bar: string
}

function foo({}, {foo, bar}: ISomething) {}

function baz([], {foo, bar}: ISomething) {}

function one([], {}) {}

function two([], [a, b, c]: number[]) {}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
