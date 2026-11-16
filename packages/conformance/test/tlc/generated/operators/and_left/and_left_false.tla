(*---
description: and_left applied to false, a BoolValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_land
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE and_left_false ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(FALSE /\ TRUE)
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
