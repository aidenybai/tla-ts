/*---
description: Ported from TypeScript's tests/cases/compiler/assignToObjectTypeWithPrototypeProperty.ts.
outcome: success
source: tests/cases/compiler/assignToObjectTypeWithPrototypeProperty.ts
---*/
// @target: es2015
class XEvent {}
var p: XEvent = XEvent.prototype;
var x: {prototype: XEvent} = XEvent;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
