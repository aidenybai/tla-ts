(*---
description: cap of subset, a SubsetValue, and set_diff, a SetDiffValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_subset__set_diff ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SUBSET {1, 2}) \cap ({1, 2} \ {2}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module cap_subset__set_diff failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}, {2}, {1, 2}}
---*)
