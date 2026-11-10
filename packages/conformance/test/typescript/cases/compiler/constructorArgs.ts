/*---
description: Ported from TypeScript's tests/cases/compiler/constructorArgs.ts.
outcome: success
source: tests/cases/compiler/constructorArgs.ts
---*/
// @target: es2015
interface Options {
 value: number;
}

class Super {
 constructor(value:number) {
 }
}

class Sub extends Super {
 constructor(public options:Options) {
  super(options.value);
 } 
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
