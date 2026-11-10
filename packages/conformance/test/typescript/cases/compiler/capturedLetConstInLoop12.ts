/*---
description: Ported from TypeScript's tests/cases/compiler/capturedLetConstInLoop12.ts.
outcome: success
source: tests/cases/compiler/capturedLetConstInLoop12.ts
---*/
// @target: es2015
// @strict: false
(function() {
    "use strict";

    for (let i = 0; i < 4; i++) {
        (() => [i] = [i + 1])();
    }
})();

(function() {
    "use strict";

    for (let i = 0; i < 4; i++) {
        (() => ({a:i} = {a:i + 1}))();
    }
})();

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
