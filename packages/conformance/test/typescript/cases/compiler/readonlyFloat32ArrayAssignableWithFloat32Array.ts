/*---
description: Ported from TypeScript's tests/cases/compiler/readonlyFloat32ArrayAssignableWithFloat32Array.ts.
outcome: success
source: tests/cases/compiler/readonlyFloat32ArrayAssignableWithFloat32Array.ts
---*/
// @target: es2015
// @strict: true
function update(b: Readonly<Float32Array>) {
    const c = copy(b);
    add(c, c);
}

function add(a: Float32Array, b: Float32Array, c: Float32Array = a) {
    c[0] = a[0] + b[0];
}

function copy(a: Float32Array) {
    return new Float32Array(a);
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
