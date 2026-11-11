(*---
description: apply of bag, a FcnRcdValue, and double_at, a FcnRcdValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_bag__double_at ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SetToBag({1}))[(1 :> 2) @@ (2 :> 3)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_bag__double_at failed.
    Attempted to check equality of integer 1 with non-integer:
    <<2, 3>>
---*)
