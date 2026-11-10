/*---
description: Ported from TypeScript's tests/cases/conformance/es6/templates/templateStringInIndexExpressionES6.ts.
outcome: success
source: tests/cases/conformance/es6/templates/templateStringInIndexExpressionES6.ts
---*/
﻿// @target: ES6
`abc${0}abc`[`0`];

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
