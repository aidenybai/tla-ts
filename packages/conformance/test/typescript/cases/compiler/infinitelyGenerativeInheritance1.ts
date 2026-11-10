/*---
description: Ported from TypeScript's tests/cases/compiler/infinitelyGenerativeInheritance1.ts.
outcome: success
source: tests/cases/compiler/infinitelyGenerativeInheritance1.ts
---*/
// @target: es2015
interface Stack<T> {
      pop(): T
      zip<S>(a: Stack<S>): Stack<{ x: T; y: S }>
}

interface MyStack<T> extends Stack<T> {
      zip<S>(a: Stack<S>): Stack<{ x: T; y: S }>
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
