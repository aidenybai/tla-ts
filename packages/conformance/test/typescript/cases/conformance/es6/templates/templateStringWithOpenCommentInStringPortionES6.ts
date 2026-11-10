/*---
description: Ported from TypeScript's tests/cases/conformance/es6/templates/templateStringWithOpenCommentInStringPortionES6.ts.
outcome: success
source: tests/cases/conformance/es6/templates/templateStringWithOpenCommentInStringPortionES6.ts
---*/
﻿// @target: ES6
` /**head  ${ 10 } // still middle  ${ 20 } /* still tail `

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
