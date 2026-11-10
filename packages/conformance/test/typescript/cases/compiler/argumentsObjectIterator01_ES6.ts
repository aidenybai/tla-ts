/*---
description: Ported from TypeScript's tests/cases/compiler/argumentsObjectIterator01_ES6.ts.
outcome: success
source: tests/cases/compiler/argumentsObjectIterator01_ES6.ts
---*/
//@target: ES6

function doubleAndReturnAsArray(x: number, y: number, z: number): [number, number, number] {
    let result = [];
    for (let arg of arguments) {
        result.push(arg + arg);
    }
    return <[any, any, any]>result;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
