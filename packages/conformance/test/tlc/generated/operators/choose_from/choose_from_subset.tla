(*---
description: choose_from applied to subset, a SubsetValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_bc
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE choose_from_subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CHOOSE e \in SUBSET {1, 2} : TRUE)
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
