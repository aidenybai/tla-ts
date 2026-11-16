(*---
description: "A LAMBDA body can hold a LET."
ref: "tlc2/value/impl/OpLambdaValue.java#eval"
flags: [expression]
outcome: success
---*)
---- MODULE lambda_with_let_body ----
EXTENDS Integers
Apply(f(_), a) == f(a)
Test == Apply(LAMBDA x : LET y == x * x IN y + y, 3) = 18
====

(*--- recorded
all:
  exit: 0
---*)
