/*---
description: Ported from TypeScript's tests/cases/compiler/objectInstantiationFromUnionSpread.ts.
outcome: success
source: tests/cases/compiler/objectInstantiationFromUnionSpread.ts
---*/
// @target: es2015
// @strictFunctionTypes: true

// #40995

interface Success {
  isSuccess: true;
}

interface Fail {
  isSuccess: false;
}

type Item = Success | Fail;

function f1(a: Item[]) {
  a.map(item => ({ ...item })).filter(value => {});
}

function f2<T>(a: Item[]) {
  a.map(item => ({ ...item })).filter(value => {});
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
