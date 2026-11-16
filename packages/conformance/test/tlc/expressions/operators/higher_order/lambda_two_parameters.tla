(*---
description: "A LAMBDA can have several parameters."
ref: "tlc2/value/impl/OpLambdaValue.java#eval"
flags: [expression]
outcome: success
---*)
---- MODULE lambda_two_parameters ----
EXTENDS Integers
Apply2(f(_, _), a, b) == f(a, b)
Test == Apply2(LAMBDA x, y : x - y, 5, 2) = 3
====

(*--- recorded
all:
  exit: 0
---*)
