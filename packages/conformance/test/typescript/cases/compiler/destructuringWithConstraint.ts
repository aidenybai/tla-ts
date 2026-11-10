/*---
description: Ported from TypeScript's tests/cases/compiler/destructuringWithConstraint.ts.
outcome: success
source: tests/cases/compiler/destructuringWithConstraint.ts
---*/
// @target: es2015
// @strict: true

// Repro from #22823

interface Props {
    foo?: boolean;
}

function foo<P extends Props>(props: Readonly<P>) {
    let { foo = false } = props;
    if (foo === true) { }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
