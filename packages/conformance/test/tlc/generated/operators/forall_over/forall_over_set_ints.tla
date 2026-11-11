(*---
description: forall_over applied to set_ints, a SetEnumValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_be
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE forall_over_set_ints ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(\A e \in {2, 1} : TRUE)
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
