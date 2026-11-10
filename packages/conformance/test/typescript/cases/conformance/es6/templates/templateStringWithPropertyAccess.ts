/*---
description: Ported from TypeScript's tests/cases/conformance/es6/templates/templateStringWithPropertyAccess.ts.
outcome: success
source: tests/cases/conformance/es6/templates/templateStringWithPropertyAccess.ts
---*/
﻿// @target: es2015
`abc${0}abc`.indexOf(`abc`);

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
