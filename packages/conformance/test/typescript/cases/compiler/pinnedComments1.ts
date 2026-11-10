/*---
description: Ported from TypeScript's tests/cases/compiler/pinnedComments1.ts.
outcome: success
source: tests/cases/compiler/pinnedComments1.ts
---*/
// @target: es2015
// @removeComments: true
/*!=========
    Keep this pinned comment
   =========
*/

/* unpinned comment */
/*! pinned comment that need to be removed */
class C {
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
