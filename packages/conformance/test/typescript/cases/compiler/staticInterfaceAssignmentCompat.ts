/*---
description: Ported from TypeScript's tests/cases/compiler/staticInterfaceAssignmentCompat.ts.
outcome: success
source: tests/cases/compiler/staticInterfaceAssignmentCompat.ts
---*/
// @target: es2015
class Shape {
    static create(): Shape {
        return new Shape();
    }
}

interface ShapeFactory {
    create(): Shape;
}

var x: ShapeFactory = Shape;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
