/*---
description: Ported from TypeScript's tests/cases/conformance/es6/templates/templateStringWithEmbeddedTypeAssertionOnAdditionES6.ts.
outcome: success
source: tests/cases/conformance/es6/templates/templateStringWithEmbeddedTypeAssertionOnAdditionES6.ts
---*/
﻿// @target: ES6
var x = `abc${ <any>(10 + 10) }def`;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
