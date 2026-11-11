(*---
description: "A LAMBDA body can hold a CHOOSE."
ref: "tlc2/value/impl/OpLambdaValue.java#eval"
flags: [expression]
outcome: success
---*)
---- MODULE lambda_with_choose_body ----
EXTENDS Integers
Apply(f(_), a) == f(a)
Test == Apply(LAMBDA s : CHOOSE e \in s : TRUE, {2, 1}) = 1
====

(*--- recorded
all:
  exit: 0
---*)
