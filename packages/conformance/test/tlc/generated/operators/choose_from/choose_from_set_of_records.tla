(*---
description: choose_from applied to set_of_records, a SetOfRcdsValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_bc
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE choose_from_set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CHOOSE e \in [a : {1, 2}] : TRUE)
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 1]"
---*)
