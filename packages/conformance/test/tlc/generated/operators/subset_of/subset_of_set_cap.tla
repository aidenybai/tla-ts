(*---
description: subset_of applied to set_cap, a SetCapValue.
ref: tlc2/value/impl/SubsetValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subset_of_set_cap ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SUBSET {1, 2} \cap {2, 3})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module subset_of_set_cap failed.
    Attempted to check if the non-enumerable value
    2
    is element of
    {{}, {1}, {2}, {1, 2}}
---*)
