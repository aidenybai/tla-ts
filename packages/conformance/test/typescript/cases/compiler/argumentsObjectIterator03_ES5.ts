/*---
description: Ported from TypeScript's tests/cases/compiler/argumentsObjectIterator03_ES5.ts.
outcome: success
source: tests/cases/compiler/argumentsObjectIterator03_ES5.ts
---*/
//@target: ES5, ES2015

function asReversedTuple(a: number, b: string, c: boolean): [boolean, string, number] {
    let [x, y, z] = arguments;
    
    return [z, y, x];
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
