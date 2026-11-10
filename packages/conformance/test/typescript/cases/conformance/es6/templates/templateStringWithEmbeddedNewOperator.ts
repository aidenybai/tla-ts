/*---
description: Ported from TypeScript's tests/cases/conformance/es6/templates/templateStringWithEmbeddedNewOperator.ts.
outcome: success
source: tests/cases/conformance/es6/templates/templateStringWithEmbeddedNewOperator.ts
---*/
﻿// @target: es2015
var x = `abc${ new String("Hi") }def`;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
