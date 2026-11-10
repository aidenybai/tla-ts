/*---
description: Ported from TypeScript's tests/cases/compiler/intersectionSatisfiesConstraint.ts.
outcome: success
source: tests/cases/compiler/intersectionSatisfiesConstraint.ts
---*/
// @target: es2015
// @strict: true
// @lib: esnext

interface FirstInterface {
    commonProperty: number
}

interface SecondInterface {
    commonProperty: number
}

const myFirstFunction = <T extends FirstInterface | SecondInterface>(param1: T) => {
    const newParam: T & { otherProperty: number } = Object.assign(param1, { otherProperty: 3 })
    mySecondFunction(newParam)
}

const mySecondFunction = <T extends { commonProperty: number, otherProperty: number }>(newParam: T) => {
    return newParam
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
