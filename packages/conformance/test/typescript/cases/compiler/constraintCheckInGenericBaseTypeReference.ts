/*---
description: Ported from TypeScript's tests/cases/compiler/constraintCheckInGenericBaseTypeReference.ts.
outcome: success
source: tests/cases/compiler/constraintCheckInGenericBaseTypeReference.ts
---*/
// @target: es2015
// No errors
class Constraint {
    public method() { }
}
class GenericBase<T extends Constraint> {
    public items: any;
}
class Derived extends GenericBase<TypeArg> {

}
class TypeArg {
    public method() {
        Container.People.items;
    }
}

class Container {
    public static People: Derived
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
