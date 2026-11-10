/*---
description: Ported from TypeScript's tests/cases/compiler/contextualTypingWithGenericSignature.ts.
outcome: success
source: tests/cases/compiler/contextualTypingWithGenericSignature.ts
---*/
﻿// @target: es2015
// If e is a FunctionExpression or ArrowFunctionExpression with no type parameters and no parameter or return type annotations, and T is a function type with EXACTLY ONE non - generic call signature, then any inferences made for type parameters referenced by the parameters of T’s call signature are fixed(section 4.12.2) and e is processed with the contextual type T, as described in section 4.9.3.

var f2: {
    <T, U>(x: T, y: U): T
};

f2 = (x, y) => { return x }

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
