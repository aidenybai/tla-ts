/*---
description: Ported from TypeScript's tests/cases/conformance/override/override16.ts.
outcome: success
source: tests/cases/conformance/override/override16.ts
---*/
// @target: esnext,es2015
// @noImplicitOverride: true

class A {
    foo?: string;
}

class B extends A {
    override foo = "string";
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
