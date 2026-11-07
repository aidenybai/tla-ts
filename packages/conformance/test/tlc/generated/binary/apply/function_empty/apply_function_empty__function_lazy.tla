(*---
description: apply of function_empty, a FcnRcdValue, and function_lazy, a FcnLambdaValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_function_empty__function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {} |-> x])[[x \in Nat |-> x]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_function_empty__function_lazy failed.
    In applying the function
    <<>>,
    the first argument is:
    [x \in Nat |-> <expression line 14, col 50 to line 14, col 50 of module apply_function_empty__function_lazy>]
    which is not in its domain.
---*)
