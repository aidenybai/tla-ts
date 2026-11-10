/*---
description: Ported from TypeScript's tests/cases/compiler/es5SetterparameterDestructuringNotElided.ts.
outcome: success
source: tests/cases/compiler/es5SetterparameterDestructuringNotElided.ts
---*/
// @target: es5, es2015
const foo = {
    set foo([start, end]: [any, any]) {
        void start;
        void end;
    },
};

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
