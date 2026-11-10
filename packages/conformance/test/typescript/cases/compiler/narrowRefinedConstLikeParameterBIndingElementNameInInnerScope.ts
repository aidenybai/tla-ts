/*---
description: Ported from TypeScript's tests/cases/compiler/narrowRefinedConstLikeParameterBIndingElementNameInInnerScope.ts.
outcome: success
source: tests/cases/compiler/narrowRefinedConstLikeParameterBIndingElementNameInInnerScope.ts
---*/
// @target: es2015
// @strict: true
// @noEmit: true

function ff({ a, b }: { a: string | undefined, b: () => void }) {
  if (a !== undefined) {
    b = () => {
      const x: string = a;
    }
  }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
