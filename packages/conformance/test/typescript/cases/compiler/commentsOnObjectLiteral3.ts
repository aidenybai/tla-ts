/*---
description: Ported from TypeScript's tests/cases/compiler/commentsOnObjectLiteral3.ts.
outcome: success
source: tests/cases/compiler/commentsOnObjectLiteral3.ts
---*/
// @removeComments: false
// @target: ES5, ES2015

var v = {
 //property
 prop: 1 /* multiple trailing comments */ /*trailing comments*/,
 //property
 func: function () {
 },
 //PropertyName + CallSignature
 func1() { },
 //getter
 get a() {
  return this.prop;
 } /*trailing 1*/,
 //setter
 set a(value) {
  this.prop = value;
 } // trailing 2
};

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
