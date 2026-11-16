(*---
description: choose_from applied to set_cup, a SetCupValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_bc
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE choose_from_set_cup ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CHOOSE e \in {1} \cup {2} : TRUE)
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
