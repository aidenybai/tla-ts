/*---
description: Ported from TypeScript's tests/cases/conformance/es6/templates/templateStringWithEmbeddedCommentsES6.ts.
outcome: success
source: tests/cases/conformance/es6/templates/templateStringWithEmbeddedCommentsES6.ts
---*/
﻿// @target: ES6
`head${ // single line comment
10
}
middle${
/* Multi-
 * line
 * comment
 */
 20
 // closing comment
}
tail`;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
