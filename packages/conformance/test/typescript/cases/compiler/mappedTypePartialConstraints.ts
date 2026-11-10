/*---
description: Ported from TypeScript's tests/cases/compiler/mappedTypePartialConstraints.ts.
outcome: success
source: tests/cases/compiler/mappedTypePartialConstraints.ts
---*/
// @target: es2015
// Repro from #16985

interface MyInterface {
  something: number;
}

class MyClass<T extends MyInterface> {
  doIt(data : Partial<T>) {}
}

class MySubClass extends MyClass<MyInterface> {}

function fn(arg: typeof MyClass) {};

fn(MySubClass);

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
