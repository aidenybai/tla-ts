/*---
description: Ported from TypeScript's tests/cases/conformance/classes/mixinAccessors4.ts.
outcome: success
source: tests/cases/conformance/classes/mixinAccessors4.ts
---*/
// @strict: true
// @target: esnext
// @declaration: true

// https://github.com/microsoft/TypeScript/issues/44938

class A {
  constructor(...args: any[]) {}
  get myName(): string {
    return "A";
  }
}

function Mixin<T extends typeof A>(Super: T) {
  return class B extends Super {
    get myName(): string {
      return "B";
    }
  };
}

class C extends Mixin(A) {
  get myName(): string {
    return "C";
  }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
