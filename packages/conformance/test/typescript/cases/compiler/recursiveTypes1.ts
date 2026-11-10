/*---
description: Ported from TypeScript's tests/cases/compiler/recursiveTypes1.ts.
outcome: success
source: tests/cases/compiler/recursiveTypes1.ts
---*/
// @target: es2015
interface Entity<T extends Entity<T>> {
   X: T;
   Y: T;
}

interface Person<U extends Person<U>> extends Entity<U> {
	n: number;
}

interface Customer extends Person<Customer> {
	s: string;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
