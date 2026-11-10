(*---
description: Compares colon_greater, a FcnRcdValue, with set_diff, a SetDiffValue.
ref: tlc2/value/impl/FcnRcdValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_colon_greater__set_diff ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1 :> 2) = ({1, 2} \ {2}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_colon_greater__set_diff failed.
    Attempted to check equality of the function <<2>> with the value:
    {1}
---*)
