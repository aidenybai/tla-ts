(*---
description: apply of function_pair_domain, a FcnRcdValue, and model_value, a ModelValue.
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
---- MODULE apply_function_pair_domain__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT(([x \in {1}, y \in {2} |-> x + y])[mv])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 18, col 8 to line 18, col 11 of module apply_function_pair_domain__model_value failed.
    In applying the function
    (<<1, 2>> :> 3),
    the argument list is:
    mv
    which does not match its formal parameter.
---*)
