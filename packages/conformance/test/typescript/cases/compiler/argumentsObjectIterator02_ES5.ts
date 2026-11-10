/*---
description: Ported from TypeScript's tests/cases/compiler/argumentsObjectIterator02_ES5.ts.
outcome: success
source: tests/cases/compiler/argumentsObjectIterator02_ES5.ts
---*/
//@target: ES5, ES2015

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
