(*---
description: choose_from applied to cross, a SetOfTuplesValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_bc
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE choose_from_cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CHOOSE e \in {1, 2} \X {3} : TRUE)
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 3>>"
---*)
