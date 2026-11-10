/*---
description: Ported from TypeScript's tests/cases/compiler/genericInterfaceImplementation.ts.
outcome: success
source: tests/cases/compiler/genericInterfaceImplementation.ts
---*/
// @target: es2015
interface IOption<A> {
    get(): A;

    flatten<B>(): IOption<B>;
}

class None<T> implements IOption<T>{
    get(): T {
        throw null;
    }

    flatten<U>() : IOption<U> {
        return new None<U>();
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
