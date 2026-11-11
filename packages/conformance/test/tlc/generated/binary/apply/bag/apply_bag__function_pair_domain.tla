(*---
description: apply of bag, a FcnRcdValue, and function_pair_domain, a FcnRcdValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_bag__function_pair_domain ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SetToBag({1}))[[x \in {1}, y \in {2} |-> x + y]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_bag__function_pair_domain failed.
    Attempted to check equality of integer 1 with non-integer:
    (<<1, 2>> :> 3)
---*)
