/*---
description: Ported from TypeScript's tests/cases/compiler/nonNullFullInference.ts.
outcome: success
source: tests/cases/compiler/nonNullFullInference.ts
---*/
// @target: es2015
// @noImplicitAny: true
// https://github.com/microsoft/TypeScript/issues/19577

function testNonNullInference(numbers: number[]) {
    let last;

    for (const n of numbers) {
        if (n % 2) {
            return n;
        }

        last = n;
    }

    last;
    last!;
}

function testNonNullInferenceWithArrays(numbers: number[]) {
    let result;
    const arr = [];

    for (const n of numbers) {
        if (n % 2) {
            return [n];
        }

        arr.push(n);
        result = arr;
    }

    result;
    result!;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
