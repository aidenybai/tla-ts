(*---
description: except_field applied to subset, a SubsetValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_exc
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE except_field_subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SUBSET {1, 2} EXCEPT !.a = 9])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module except_field_subset failed.
    Attempted to apply EXCEPT construct to the value {{}, {1}, {2}, {1, 2}}.
---*)
