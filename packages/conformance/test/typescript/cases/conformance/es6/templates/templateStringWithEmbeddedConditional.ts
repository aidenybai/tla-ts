/*---
description: Ported from TypeScript's tests/cases/conformance/es6/templates/templateStringWithEmbeddedConditional.ts.
outcome: success
source: tests/cases/conformance/es6/templates/templateStringWithEmbeddedConditional.ts
---*/
﻿// @target: es2015
var x = `abc${ true ? false : " " }def`;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
