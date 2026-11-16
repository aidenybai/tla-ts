(*---
description: apply of function_lazy, a FcnLambdaValue, and int_minimum, a IntValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_function_lazy__int_minimum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in Nat |-> x])[(-2147483647 - 1)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_function_lazy__int_minimum failed.
    In applying the function
    [x \in Nat |-> <expression line 14, col 32 to line 14, col 32 of module apply_function_lazy__int_minimum>],
    the first argument is:
    -2147483648
    which is not in its domain.
---*)
