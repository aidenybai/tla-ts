/*---
description: Ported from TypeScript's tests/cases/compiler/targetTypeArgs.ts.
outcome: success
source: tests/cases/compiler/targetTypeArgs.ts
---*/
// @target: es2015
function foo(callback: (x: string) => void) {
    callback("hello");   
}

foo(function(x) { x });

[1].forEach(function(v,i,a) { v });
["hello"].every(function(v,i,a) {return true;});
[1].every(function(v,i,a) {return true;});
[1].every(function(v,i,a) {return true;});
["s"].every(function(v,i,a) {return true;});
["s"].forEach(function(v,i,a) { v });

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
