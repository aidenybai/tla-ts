/*---
description: Ported from TypeScript's tests/cases/compiler/enumMapBackIntoItself.ts.
outcome: success
source: tests/cases/compiler/enumMapBackIntoItself.ts
---*/
// @target: es2015
enum TShirtSize {
   Small,
   Medium,
   Large
}
var mySize = TShirtSize.Large;
var test = TShirtSize[mySize];
// specifically checking output here, bug was that test used to be undefined at runtime
test + ''

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
