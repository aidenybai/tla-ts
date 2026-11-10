/*---
description: Ported from TypeScript's tests/cases/compiler/unexportedInstanceClassVariables.ts.
outcome: success
source: tests/cases/compiler/unexportedInstanceClassVariables.ts
---*/
// @target: es2015
namespace M{
	class A{
		constructor(val:string){}
	}
}

namespace M{
	class A {}  
 
 	var a = new A();
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
