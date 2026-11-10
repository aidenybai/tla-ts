/*---
description: Ported from TypeScript's tests/cases/compiler/objectLiteralPropertyImplicitlyAny.ts.
outcome: success
source: tests/cases/compiler/objectLiteralPropertyImplicitlyAny.ts
---*/
// @target: esnext
// @noImplicitAny: true

const foo = Symbol.for("foo");
const o = { [foo]: undefined };

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
