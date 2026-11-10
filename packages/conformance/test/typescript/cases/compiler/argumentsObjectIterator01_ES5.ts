/*---
description: Ported from TypeScript's tests/cases/compiler/argumentsObjectIterator01_ES5.ts.
outcome: success
source: tests/cases/compiler/argumentsObjectIterator01_ES5.ts
---*/
//@target: ES5, ES2015

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
