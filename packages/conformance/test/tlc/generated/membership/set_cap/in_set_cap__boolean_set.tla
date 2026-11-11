(*---
description: Asks whether boolean_set is in set_cap, a SetCapValue.
ref: tlc2/value/impl/SetCapValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_set_cap__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((BOOLEAN) \in ({1, 2} \cap {2, 3}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module in_set_cap__boolean_set failed.
    Attempted to check equality of integer 2 with non-integer:
    {FALSE, TRUE}
---*)
