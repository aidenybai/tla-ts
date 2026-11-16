(*---
description: "A LAMBDA sees the binders enclosing it."
ref: "tlc2/value/impl/OpLambdaValue.java#eval"
flags: [expression]
outcome: success
---*)
---- MODULE lambda_captures_binder ----
EXTENDS Integers
Apply(f(_), a) == f(a)
Test == \A y \in 1..2 : Apply(LAMBDA x : x + y, 1) = y + 1
====

(*--- recorded
all:
  exit: 0
---*)
