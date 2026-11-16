(*---
description: apply of double_at, a FcnRcdValue, and set_filter, a SetPredValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_double_at__set_filter ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((1 :> 2) @@ (2 :> 3))[{x \in 1..3 : x > 1}])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_double_at__set_filter failed.
    Attempted to check equality of integer 1 with non-integer:
    {2, 3}
---*)
