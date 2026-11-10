/*---
description: Ported from TypeScript's tests/cases/compiler/instanceAndStaticDeclarations1.ts.
outcome: success
source: tests/cases/compiler/instanceAndStaticDeclarations1.ts
---*/
// @target: es2015
// from spec

class Point {
    constructor(public x: number, public y: number) { }
    public distance(p: Point) {
        var dx = this.x - p.x;
        var dy = this.y - p.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    static origin = new Point(0, 0);
    static distance(p1: Point, p2: Point) { return p1.distance(p2); }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
