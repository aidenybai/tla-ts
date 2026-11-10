/*---
description: Ported from TypeScript's tests/cases/conformance/es6/templates/templateStringWithEmbeddedModuloES6.ts.
outcome: success
source: tests/cases/conformance/es6/templates/templateStringWithEmbeddedModuloES6.ts
---*/
﻿// @target: ES6
var x = `abc${ 1 % 1 }def`;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
