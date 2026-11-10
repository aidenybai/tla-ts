/*---
description: Ported from TypeScript's tests/cases/conformance/expressions/contextualTyping/iterableContextualTyping1.ts.
outcome: success
source: tests/cases/conformance/expressions/contextualTyping/iterableContextualTyping1.ts
---*/
﻿//@target: ES6
var iter: Iterable<(x: string) => number> = [s => s.length];

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
