/*---
description: Ported from TypeScript's tests/cases/conformance/es6/shorthandPropertyAssignment/objectLiteralShorthandPropertiesFunctionArgument.ts.
outcome: success
source: tests/cases/conformance/es6/shorthandPropertyAssignment/objectLiteralShorthandPropertiesFunctionArgument.ts
---*/
﻿// @target: es2015
// @lib: es5
var id: number = 10000;
var name: string = "my name";

var person = { name, id };

function foo(p: { name: string; id: number }) { }
foo(person);


var obj = { name: name, id: id };

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
