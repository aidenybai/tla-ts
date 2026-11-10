/*---
description: Ported from TypeScript's tests/cases/compiler/inheritanceOfGenericConstructorMethod1.ts.
outcome: success
source: tests/cases/compiler/inheritanceOfGenericConstructorMethod1.ts
---*/
// @target: es2015
// @strict: false
class A<T> { }
class B<T> extends A<T> {}
var a = new A<Date>();
var b1 = new B(); // no error
var b2: B<Date> = new B<Date>(); // no error
var b3 = new B<Date>(); // error, could not select overload for 'new' expression

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
