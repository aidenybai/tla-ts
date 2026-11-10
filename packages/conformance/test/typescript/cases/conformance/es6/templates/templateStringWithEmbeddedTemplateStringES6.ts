/*---
description: Ported from TypeScript's tests/cases/conformance/es6/templates/templateStringWithEmbeddedTemplateStringES6.ts.
outcome: success
source: tests/cases/conformance/es6/templates/templateStringWithEmbeddedTemplateStringES6.ts
---*/
﻿// @target: ES6
var x = `123${ `456 ${ " | " } 654` }321 123${ `456 ${ " | " } 654` }321`;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
