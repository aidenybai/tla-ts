/*---
description: Ported from TypeScript's tests/cases/compiler/noImplicitAnyUnionNormalizedObjectLiteral1.ts.
outcome: success
source: tests/cases/compiler/noImplicitAnyUnionNormalizedObjectLiteral1.ts
---*/
// @target: es2015
// @strictNullChecks: false
// @noImplicitAny: true
// @noEmit: true

// https://github.com/microsoft/TypeScript/issues/58150

function doSthWithParams(params: unknown) {
  if (typeof params !== "object") {
    return {};
  }

  return {
    c: "foo",
    p: "bar",
    s: "baz",
  };
}

const bar = {
  p: null,
  s: null,
  ...doSthWithParams({
    p: "hello",
    s: "world",
  }),
};

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
