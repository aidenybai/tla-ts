(*---
description: not applied to subset, a SubsetValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_lnot
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE not_subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(~(SUBSET {1, 2}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module not_subset failed.
    Attempted to apply the operator ~ to a non-boolean
    (a set of the form SUBSET S)
    line 14, col 16 to line 14, col 31 of module not_subset
---*)
