/*---
description: Ported from TypeScript's tests/cases/compiler/underscoreEscapedNameInEnum.ts.
outcome: success
source: tests/cases/compiler/underscoreEscapedNameInEnum.ts
---*/
// @target: es2015
enum E {
    "__foo" = 1,
    bar = E["__foo"] + 1
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
