(*---
description: /= of int_zero and function_pair_domain, including overflow and type errors.
ref: tlc2/module/Naturals.java; tlc2/module/Integers.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE not_equal_int_zero__function_pair_domain ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((0) /= ([x \in {1}, y \in {2} |-> x + y]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module not_equal_int_zero__function_pair_domain failed.
    Attempted to check equality of integer 0 with non-integer:
    (<<1, 2>> :> 3)
---*)
