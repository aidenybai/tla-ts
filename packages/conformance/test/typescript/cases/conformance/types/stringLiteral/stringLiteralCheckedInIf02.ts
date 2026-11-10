/*---
description: Ported from TypeScript's tests/cases/conformance/types/stringLiteral/stringLiteralCheckedInIf02.ts.
outcome: success
source: tests/cases/conformance/types/stringLiteral/stringLiteralCheckedInIf02.ts
---*/
﻿// @target: es2015

type S = "a" | "b";
type T = S[] | S;

function isS(t: T): t is S {
    return t === "a" || t === "b";
}

function f(foo: T) {
    if (isS(foo)) {
        return foo;
    }
    else { 
        return foo[0];
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
