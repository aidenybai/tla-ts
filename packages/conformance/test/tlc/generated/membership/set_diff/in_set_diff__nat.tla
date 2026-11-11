(*---
description: Asks whether nat is in set_diff, a SetDiffValue.
ref: tlc2/value/impl/SetDiffValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_set_diff__nat ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Nat) \in ({1, 2} \ {2}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module in_set_diff__nat failed.
    Attempted to check equality of integer 1 with non-integer:
    Nat
---*)
