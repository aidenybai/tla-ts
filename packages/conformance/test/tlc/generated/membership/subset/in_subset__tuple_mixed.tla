(*---
description: Asks whether tuple_mixed is in subset, a SubsetValue.
ref: tlc2/value/impl/SubsetValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_subset__tuple_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<1, "a", {TRUE}>>) \in (SUBSET {1, 2}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module in_subset__tuple_mixed failed.
    Attempted to check if the non-enumerable value
    <<1, "a", {TRUE}>>
    is element of
    {{}, {1}, {2}, {1, 2}}
---*)
