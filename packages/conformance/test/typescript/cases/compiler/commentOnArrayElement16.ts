/*---
description: Ported from TypeScript's tests/cases/compiler/commentOnArrayElement16.ts.
outcome: success
source: tests/cases/compiler/commentOnArrayElement16.ts
---*/
﻿// @target: es2015
const array = [
    // comment start
    1,
    2,
    // comment end
];

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
