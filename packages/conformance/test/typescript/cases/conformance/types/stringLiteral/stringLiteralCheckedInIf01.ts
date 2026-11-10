/*---
description: Ported from TypeScript's tests/cases/conformance/types/stringLiteral/stringLiteralCheckedInIf01.ts.
outcome: success
source: tests/cases/conformance/types/stringLiteral/stringLiteralCheckedInIf01.ts
---*/
﻿// @target: es2015

type S = "a" | "b";
type T = S[] | S;

function f(foo: T) {
    if (foo === "a") {
        return foo;
    }
    else if (foo === "b") {
        return foo;
    }
    else { 
        return (foo as S[])[0];
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
