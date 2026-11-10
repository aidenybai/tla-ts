/*---
description: Ported from TypeScript's tests/cases/conformance/classes/members/inheritanceAndOverriding/derivedClassOverridesIndexersWithAssignmentCompatibility.ts.
outcome: success
source: tests/cases/conformance/classes/members/inheritanceAndOverriding/derivedClassOverridesIndexersWithAssignmentCompatibility.ts
---*/
// @target: es2015
class Base {
    [x: string]: Object;
}

// ok, use assignment compatibility
class Derived extends Base {
    [x: string]: any;
}

class Base2 {
    [x: number]: Object;
}

// ok, use assignment compatibility
class Derived2 extends Base2 {
    [x: number]: any;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
