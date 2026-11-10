/*---
description: Ported from TypeScript's tests/cases/compiler/commentOnArrayElement4.ts.
outcome: success
source: tests/cases/compiler/commentOnArrayElement4.ts
---*/
﻿// @target: es2015
const array = [
    /* element 1 */
    1,
    /* end of element 1 */
];

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
