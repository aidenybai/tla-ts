/*---
description: Ported from TypeScript's tests/cases/compiler/flowInFinally1.ts.
outcome: success
source: tests/cases/compiler/flowInFinally1.ts
---*/
// @target: es2015
// @strictNullChecks: true

class A {
  constructor() { }
  method() { }
}

let a: A | null = null;

try {
  a = new A();
} finally {
  if (a) {
    a.method();
  }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
