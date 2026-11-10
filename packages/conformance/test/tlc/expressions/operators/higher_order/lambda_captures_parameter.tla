(*---
description: "A LAMBDA sees the parameters of the enclosing operator."
ref: "tlc2/value/impl/OpLambdaValue.java#eval"
flags: [expression]
outcome: success
---*)
---- MODULE lambda_captures_parameter ----
EXTENDS Integers
Apply(f(_), a) == f(a)
G(k) == Apply(LAMBDA x : x + k, 1)
Test == G(5) = 6
====

(*--- recorded
all:
  exit: 0
---*)
