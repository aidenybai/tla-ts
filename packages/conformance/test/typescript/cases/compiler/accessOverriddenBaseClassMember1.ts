/*---
description: Ported from TypeScript's tests/cases/compiler/accessOverriddenBaseClassMember1.ts.
outcome: success
source: tests/cases/compiler/accessOverriddenBaseClassMember1.ts
---*/
// @target: es2015
class Point {
    constructor(public x: number, public y: number) { }
    public toString() {
        return "x=" + this.x + " y=" + this.y;
    }
}
class ColoredPoint extends Point {
    constructor(x: number, y: number, public color: string) {
        super(x, y);
    }
    public toString() {
        return super.toString() + " color=" + this.color;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
