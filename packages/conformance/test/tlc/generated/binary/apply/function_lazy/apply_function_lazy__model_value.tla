(*---
description: apply of function_lazy, a FcnLambdaValue, and model_value, a ModelValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
config: |
  CONSTANT mv = mv
---*)
---- MODULE apply_function_lazy__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT(([x \in Nat |-> x])[mv])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 18, col 8 to line 18, col 11 of module apply_function_lazy__model_value failed.
    In applying the function
    [x \in Nat |-> <expression line 17, col 32 to line 17, col 32 of module apply_function_lazy__model_value>],
    the first argument is:
    mv
    which is not in its domain.
---*)
