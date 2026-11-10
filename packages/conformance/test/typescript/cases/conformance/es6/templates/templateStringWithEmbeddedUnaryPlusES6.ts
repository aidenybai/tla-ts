/*---
description: Ported from TypeScript's tests/cases/conformance/es6/templates/templateStringWithEmbeddedUnaryPlusES6.ts.
outcome: success
source: tests/cases/conformance/es6/templates/templateStringWithEmbeddedUnaryPlusES6.ts
---*/
﻿// @target: ES6
var x = `abc${ +Infinity }def`;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
