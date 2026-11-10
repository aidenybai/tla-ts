/*---
description: Ported from TypeScript's tests/cases/compiler/argumentsObjectIterator03_ES6.ts.
outcome: success
source: tests/cases/compiler/argumentsObjectIterator03_ES6.ts
---*/
//@target: ES6

function asReversedTuple(a: number, b: string, c: boolean): [boolean, string, number] {
    let [x, y, z] = arguments;
    
    return [z, y, x];
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
