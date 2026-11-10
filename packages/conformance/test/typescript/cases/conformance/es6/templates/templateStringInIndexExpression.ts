/*---
description: Ported from TypeScript's tests/cases/conformance/es6/templates/templateStringInIndexExpression.ts.
outcome: success
source: tests/cases/conformance/es6/templates/templateStringInIndexExpression.ts
---*/
﻿// @target: es2015
`abc${0}abc`[`0`];

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
