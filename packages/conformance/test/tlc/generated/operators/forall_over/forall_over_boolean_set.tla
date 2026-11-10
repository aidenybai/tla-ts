(*---
description: forall_over applied to boolean_set, a SetEnumValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_be
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE forall_over_boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(\A e \in BOOLEAN : TRUE)
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
