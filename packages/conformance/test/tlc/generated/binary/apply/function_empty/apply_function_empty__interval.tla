(*---
description: apply of function_empty, a FcnRcdValue, and interval, a IntervalValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_function_empty__interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {} |-> x])[1..3])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_function_empty__interval failed.
    In applying the function
    <<>>,
    the first argument is:
    1..3
    which is not in its domain.
---*)
