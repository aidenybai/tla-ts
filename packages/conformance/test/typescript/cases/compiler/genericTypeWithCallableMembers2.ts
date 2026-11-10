/*---
description: Ported from TypeScript's tests/cases/compiler/genericTypeWithCallableMembers2.ts.
outcome: success
source: tests/cases/compiler/genericTypeWithCallableMembers2.ts
---*/
// @target: es2015
function foo1<T extends { (): string; }>(f: T) {
    return f(); // should return 'string', once returned 'any'
}
 
function foo2<T extends { new (): string; }>(f: T) {
    return new f(); // should be legal, once was an error
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
