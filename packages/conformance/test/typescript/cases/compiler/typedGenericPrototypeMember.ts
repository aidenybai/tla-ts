/*---
description: Ported from TypeScript's tests/cases/compiler/typedGenericPrototypeMember.ts.
outcome: success
source: tests/cases/compiler/typedGenericPrototypeMember.ts
---*/
// @target: es2015
class List<T> {
   add(item: T) { }
}

List.prototype.add("abc"); // Valid because T is instantiated to any

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
