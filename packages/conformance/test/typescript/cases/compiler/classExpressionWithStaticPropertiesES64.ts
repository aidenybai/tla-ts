/*---
description: Ported from TypeScript's tests/cases/compiler/classExpressionWithStaticPropertiesES64.ts.
outcome: success
source: tests/cases/compiler/classExpressionWithStaticPropertiesES64.ts
---*/
// @target: es6
(class { static x = 0; });

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
