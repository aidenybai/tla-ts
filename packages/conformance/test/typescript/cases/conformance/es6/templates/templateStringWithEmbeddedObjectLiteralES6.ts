/*---
description: Ported from TypeScript's tests/cases/conformance/es6/templates/templateStringWithEmbeddedObjectLiteralES6.ts.
outcome: success
source: tests/cases/conformance/es6/templates/templateStringWithEmbeddedObjectLiteralES6.ts
---*/
﻿// @target: ES6
var x = `abc${ { x: 10, y: 20 } }def`;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
