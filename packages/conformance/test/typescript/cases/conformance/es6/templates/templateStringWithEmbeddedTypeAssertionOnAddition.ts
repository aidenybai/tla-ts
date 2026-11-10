/*---
description: Ported from TypeScript's tests/cases/conformance/es6/templates/templateStringWithEmbeddedTypeAssertionOnAddition.ts.
outcome: success
source: tests/cases/conformance/es6/templates/templateStringWithEmbeddedTypeAssertionOnAddition.ts
---*/
﻿// @target: es2015
var x = `abc${ <any>(10 + 10) }def`;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
