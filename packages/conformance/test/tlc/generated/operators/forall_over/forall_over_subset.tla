(*---
description: forall_over applied to subset, a SubsetValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_be
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE forall_over_subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(\A e \in SUBSET {1, 2} : TRUE)
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
