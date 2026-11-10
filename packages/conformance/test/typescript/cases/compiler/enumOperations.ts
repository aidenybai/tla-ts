/*---
description: Ported from TypeScript's tests/cases/compiler/enumOperations.ts.
outcome: success
source: tests/cases/compiler/enumOperations.ts
---*/
// @target: es2015
enum Enum { None = 0 }
var enumType: Enum = Enum.None;
var numberType: number = 0;
var anyType: any = 0;
 
enumType ^ numberType;
numberType ^ anyType;
 
enumType & anyType;
enumType | anyType;
enumType ^ anyType;
~anyType;
enumType <<anyType;
enumType >>anyType;
enumType >>>anyType;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
