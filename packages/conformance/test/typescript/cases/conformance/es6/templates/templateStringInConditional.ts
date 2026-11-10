/*---
description: Ported from TypeScript's tests/cases/conformance/es6/templates/templateStringInConditional.ts.
outcome: success
source: tests/cases/conformance/es6/templates/templateStringInConditional.ts
---*/
﻿// @target: es2015
var x = `abc${ " " }def` ? `abc${ " " }def` : `abc${ " " }def`;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
