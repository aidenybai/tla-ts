(*---
description: forall_over applied to set_of_functions, a SetOfFcnsValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_be
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE forall_over_set_of_functions ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(\A e \in [{1} -> {2, 3}] : TRUE)
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
