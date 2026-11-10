/*---
description: Ported from TypeScript's tests/cases/compiler/multiCallOverloads.ts.
outcome: success
source: tests/cases/compiler/multiCallOverloads.ts
---*/
// @target: es2015
interface ICallback {
    (x?: string):void;
}

function load(f: ICallback) {}

var f1: ICallback = function(z?) {}
var f2: ICallback = function(z?) {}
load(f1) // ok
load(f2) // ok
load(function() {}) // this shouldn’t be an error
load(function(z?) {}) // this shouldn't be an error

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
