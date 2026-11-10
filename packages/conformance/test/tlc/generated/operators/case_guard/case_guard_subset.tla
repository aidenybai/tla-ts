(*---
description: case_guard applied to subset, a SubsetValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_case
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE case_guard_subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE SUBSET {1, 2} -> 1 [] OTHER -> 2)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module case_guard_subset failed.
    A non-boolean expression (a set of the form SUBSET S) was used as a condition of a CASE. line 14, col 21 to line 14, col 33 of module case_guard_subset
---*)
