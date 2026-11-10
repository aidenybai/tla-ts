/*---
description: Ported from TypeScript's tests/cases/compiler/argumentsObjectIterator02_ES6.ts.
outcome: success
source: tests/cases/compiler/argumentsObjectIterator02_ES6.ts
---*/
//@target: ES6

function doubleAndReturnAsArray(x: number, y: number, z: number): [number, number, number] {
    let blah = arguments[Symbol.iterator];

    let result = [];
    for (let arg of blah()) {
        result.push(arg + arg);
    }
    return <[any, any, any]>result;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
