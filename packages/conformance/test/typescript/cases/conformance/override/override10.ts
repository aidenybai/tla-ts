/*---
description: Ported from TypeScript's tests/cases/conformance/override/override10.ts.
outcome: success
source: tests/cases/conformance/override/override10.ts
---*/
// @target: es2015
// @declaration: true
// @noImplicitOverride: true

abstract class Base {
    abstract foo(): unknown;
    abstract bar(): void;
}

abstract class Sub extends Base {
    abstract override foo(): number;
    bar() { }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
