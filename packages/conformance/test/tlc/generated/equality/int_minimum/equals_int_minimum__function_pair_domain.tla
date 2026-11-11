(*---
description: Compares int_minimum, a IntValue, with function_pair_domain, a FcnRcdValue.
ref: tlc2/value/impl/IntValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_int_minimum__function_pair_domain ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-2147483647 - 1)) = ([x \in {1}, y \in {2} |-> x + y]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_int_minimum__function_pair_domain failed.
    Attempted to check equality of integer -2147483648 with non-integer:
    (<<1, 2>> :> 3)
---*)
