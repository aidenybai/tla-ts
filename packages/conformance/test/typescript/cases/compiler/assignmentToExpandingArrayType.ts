/*---
description: Ported from TypeScript's tests/cases/compiler/assignmentToExpandingArrayType.ts.
outcome: success
source: tests/cases/compiler/assignmentToExpandingArrayType.ts
---*/
// @target: es2015
// @noImplicitAny: true
// Fixes exponential time/space in #14628
let x = []
x[0] = { foo: 'hi' }
x[0] = { foo: 'hi' }
x[0] = { foo: 'hi' }
x[0] = { foo: 'hi' }
x[0] = { foo: 'hi' }
x[0] = { foo: 'hi' }
x[0] = { foo: 'hi' }
x[0] = { foo: 'hi' }
x[0] = { foo: 'hi' }
x[0] = { foo: 'hi' }
x[0] = { foo: 'hi' }
x[0] = { foo: 'hi' }
x[0] = { foo: 'hi' } // previously ran out of memory here
x[0] = { foo: 'hi' }
x[0] = { foo: 'hi' }
x[0] = { foo: 'hi' }
x[0] = { foo: 'hi' }
x[0] = { foo: 'hi' }
x[0] = { foo: 'hi' }
x[0] = { foo: 'hi' }
x[0] = { foo: 'hi' }
x[0] = { foo: 'hi' }
x[0] = { foo: 'hi' }
x[0] = { foo: 'hi' }

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
