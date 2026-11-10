/*---
description: Ported from TypeScript's tests/cases/conformance/es6/templates/taggedTemplateStringsWithTagNamedDeclareES6.ts.
outcome: success
source: tests/cases/conformance/es6/templates/taggedTemplateStringsWithTagNamedDeclareES6.ts
---*/
﻿//@target: es6

function declare(x: any, ...ys: any[]) {
}

declare `Hello ${0} world!`;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
