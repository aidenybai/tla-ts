/*---
description: Ported from TypeScript's tests/cases/compiler/genericArrayPropertyAssignment.ts.
outcome: success
source: tests/cases/compiler/genericArrayPropertyAssignment.ts
---*/
// @target: es2015
function isEmpty(list: {length:number;})
{
return list.length ===0;
}
 
isEmpty([]); // error

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
