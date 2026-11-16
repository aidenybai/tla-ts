(*---
description: "A LAMBDA that ignores its parameter does not evaluate the argument."
ref: "tlc2/value/impl/OpLambdaValue.java#eval"
flags: [expression]
outcome: success
---*)
---- MODULE lambda_ignores_parameter ----
EXTENDS Integers
Apply(f(_), a) == f(a)
Test == Apply(LAMBDA x : 7, 1 \div 0) = 7
====

(*--- recorded
all:
  exit: 0
---*)
