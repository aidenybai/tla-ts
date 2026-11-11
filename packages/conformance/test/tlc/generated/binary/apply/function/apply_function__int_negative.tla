(*---
description: apply of function, a FcnRcdValue, and int_negative, a IntValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_function__int_negative ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {1, 2} |-> x * 2])[-3])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_function__int_negative failed.
    In applying the function
    <<2, 4>>,
    the first argument is:
    -3
    which is not in its domain.
---*)
