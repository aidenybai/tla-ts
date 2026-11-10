/*---
description: Ported from TypeScript's tests/cases/compiler/commentsEnums.ts.
outcome: success
source: tests/cases/compiler/commentsEnums.ts
---*/
// @target: ES5, ES2015
// @declaration: true
// @removeComments: false

/** Enum of colors*/
enum Colors {
    /** Fancy name for 'blue'*/
    Cornflower /* blue */,
    /** Fancy name for 'pink'*/
    FancyPink
} // trailing comment
var x = Colors.Cornflower;
x = Colors.FancyPink;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
