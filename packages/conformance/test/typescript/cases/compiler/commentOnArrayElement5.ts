/*---
description: Ported from TypeScript's tests/cases/compiler/commentOnArrayElement5.ts.
outcome: success
source: tests/cases/compiler/commentOnArrayElement5.ts
---*/
﻿// @target: es2015
const array = [
    /* element 1 */
    1,
    /* end of element 1 */
    /* extra comment */
];

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
