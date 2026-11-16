(*---
description: or_right applied to true, a BoolValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_lor
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE or_right_true ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(FALSE \/ TRUE)
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
