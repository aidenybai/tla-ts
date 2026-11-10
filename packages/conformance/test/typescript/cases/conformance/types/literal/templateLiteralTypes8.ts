/*---
description: Ported from TypeScript's tests/cases/conformance/types/literal/templateLiteralTypes8.ts.
outcome: success
source: tests/cases/conformance/types/literal/templateLiteralTypes8.ts
---*/
// @target: es2015
// @strict: true
// @noEmit: true

const enum E {
  a = "a",
  b = "b",
}

type Stringify<T extends string> = `${T}`;

let z1: `${E}` = "a";
let z2: Stringify<E> = "a";

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
