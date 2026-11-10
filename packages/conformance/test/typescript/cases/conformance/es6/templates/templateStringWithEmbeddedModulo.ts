/*---
description: Ported from TypeScript's tests/cases/conformance/es6/templates/templateStringWithEmbeddedModulo.ts.
outcome: success
source: tests/cases/conformance/es6/templates/templateStringWithEmbeddedModulo.ts
---*/
﻿// @target: es2015
var x = `abc${ 1 % 1 }def`;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
