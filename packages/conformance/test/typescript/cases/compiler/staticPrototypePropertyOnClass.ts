/*---
description: Ported from TypeScript's tests/cases/compiler/staticPrototypePropertyOnClass.ts.
outcome: success
source: tests/cases/compiler/staticPrototypePropertyOnClass.ts
---*/
// @target: es2015
class c1 {
}
class c2<T> {
}
class c3 {
    constructor() {
    }
}
class c4 {
    constructor(param: string);
    constructor(param: number);
    constructor(param: any) {
    }
}
var a = c1;
var b = c2;
var c = c3;
var d = c4;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
