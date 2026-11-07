(*---
description: implies_right applied to set_of_records, a SetOfRcdsValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_implies
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE implies_right_set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(TRUE => [a : {1, 2}])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module implies_right_set_of_records failed.
    Attempted to evaluate an expression of form P => Q when Q was
    a set of the form [d1 : S1, ... , dN : SN].
    line 14, col 16 to line 14, col 35 of module implies_right_set_of_records
---*)
