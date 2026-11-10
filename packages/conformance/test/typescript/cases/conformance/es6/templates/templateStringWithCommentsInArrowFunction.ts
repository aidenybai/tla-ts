/*---
description: Ported from TypeScript's tests/cases/conformance/es6/templates/templateStringWithCommentsInArrowFunction.ts.
outcome: success
source: tests/cases/conformance/es6/templates/templateStringWithCommentsInArrowFunction.ts
---*/
﻿// @target: es2015
// @removeComments: false

const a = 1;
const f1 = () =>
    `${
      // a
      a
    }a`;

const f2 = () =>
    `${
      // a
      a
    }`;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
