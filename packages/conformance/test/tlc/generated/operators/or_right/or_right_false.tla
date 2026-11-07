(*---
description: or_right applied to false, a BoolValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_lor
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE or_right_false ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(FALSE \/ FALSE)
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
