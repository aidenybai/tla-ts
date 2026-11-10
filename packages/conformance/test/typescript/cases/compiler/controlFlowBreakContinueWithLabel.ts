/*---
description: Ported from TypeScript's tests/cases/compiler/controlFlowBreakContinueWithLabel.ts.
outcome: success
source: tests/cases/compiler/controlFlowBreakContinueWithLabel.ts
---*/
// @target: es2015
// @strict: true

enum User { A, B }

let user: User = User.A

label: while (true) {
    switch (user) {
        case User.A:
            user = User.B;
            continue label;
        case User.B:
            break label;
    }
}
user;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
