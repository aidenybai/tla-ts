/*---
description: Ported from TypeScript's tests/cases/compiler/parseReplacementCharacter.ts.
outcome: success
source: tests/cases/compiler/parseReplacementCharacter.ts
---*/
// @target: es2015
"oops �� oops";
'oops �� oops';
`oops �� oops`;
`${"oops �� oops"}`;
// oops �� oops
/* oops �� oops */
/** oops �� oops */

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
