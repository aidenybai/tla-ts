(*---
description: Asks whether function is in subset, a SubsetValue.
ref: tlc2/value/impl/SubsetValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_subset__function ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {1, 2} |-> x * 2]) \in (SUBSET {1, 2}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module in_subset__function failed.
    Attempted to check if the non-enumerable value
    <<2, 4>>
    is element of
    {{}, {1}, {2}, {1, 2}}
---*)
