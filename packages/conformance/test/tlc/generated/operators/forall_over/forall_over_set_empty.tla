(*---
description: forall_over applied to set_empty, a SetEnumValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_be
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE forall_over_set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(\A e \in {} : TRUE)
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
