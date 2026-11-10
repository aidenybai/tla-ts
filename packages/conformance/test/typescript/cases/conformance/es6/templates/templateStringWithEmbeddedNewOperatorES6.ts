/*---
description: Ported from TypeScript's tests/cases/conformance/es6/templates/templateStringWithEmbeddedNewOperatorES6.ts.
outcome: success
source: tests/cases/conformance/es6/templates/templateStringWithEmbeddedNewOperatorES6.ts
---*/
﻿// @target: ES6
var x = `abc${ new String("Hi") }def`;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
