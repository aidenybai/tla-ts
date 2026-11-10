/*---
description: Ported from TypeScript's tests/cases/compiler/genericTypeWithCallableMembers.ts.
outcome: success
source: tests/cases/compiler/genericTypeWithCallableMembers.ts
---*/
// @target: es2015
interface Constructable {
    new (): Constructable;
}
 
class C<T extends Constructable> {
    constructor(public data: T, public data2: Constructable) { }
    create() {
        var x = new this.data(); // no error
        var x2 = new this.data2(); // was error, shouldn't be
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
