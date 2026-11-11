(*---
description: Asks whether model_value is in subset, a SubsetValue.
ref: tlc2/value/impl/SubsetValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
config: |
  CONSTANT mv = mv
---*)
---- MODULE in_subset__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((mv) \in (SUBSET {1, 2}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 18, col 8 to line 18, col 11 of module in_subset__model_value failed.
    Attempted to check if the non-enumerable value
    mv
    is element of
    {{}, {1}, {2}, {1, 2}}
---*)
