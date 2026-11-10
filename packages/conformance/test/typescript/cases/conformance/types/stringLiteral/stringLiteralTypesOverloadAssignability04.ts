/*---
description: Ported from TypeScript's tests/cases/conformance/types/stringLiteral/stringLiteralTypesOverloadAssignability04.ts.
outcome: success
source: tests/cases/conformance/types/stringLiteral/stringLiteralTypesOverloadAssignability04.ts
---*/
﻿// @target: es2015
// @declaration: true

function f(x: "foo"): number;
function f(x: "foo"): number {
    return 0;
}

function g(x: "foo"): number;
function g(x: "foo"): number {
    return 0;
}

let a = f;
let b = g;

a = b;
b = a;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
