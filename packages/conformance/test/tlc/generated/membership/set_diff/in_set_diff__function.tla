(*---
description: Asks whether function is in set_diff, a SetDiffValue.
ref: tlc2/value/impl/SetDiffValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_set_diff__function ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {1, 2} |-> x * 2]) \in ({1, 2} \ {2}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module in_set_diff__function failed.
    Attempted to check equality of integer 1 with non-integer:
    <<2, 4>>
---*)
