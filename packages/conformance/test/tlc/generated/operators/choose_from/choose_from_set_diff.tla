(*---
description: choose_from applied to set_diff, a SetDiffValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_bc
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE choose_from_set_diff ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CHOOSE e \in {1, 2} \ {2} : TRUE)
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
