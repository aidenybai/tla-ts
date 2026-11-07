(*---
description: choose_from applied to boolean_set, a SetEnumValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_bc
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE choose_from_boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CHOOSE e \in BOOLEAN : TRUE)
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
