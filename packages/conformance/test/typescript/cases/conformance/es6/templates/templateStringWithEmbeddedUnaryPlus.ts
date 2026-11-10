/*---
description: Ported from TypeScript's tests/cases/conformance/es6/templates/templateStringWithEmbeddedUnaryPlus.ts.
outcome: success
source: tests/cases/conformance/es6/templates/templateStringWithEmbeddedUnaryPlus.ts
---*/
﻿// @target: es2015
var x = `abc${ +Infinity }def`;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
