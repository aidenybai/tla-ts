(*---
description: choose_from applied to set_filter, a SetPredValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_bc
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE choose_from_set_filter ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CHOOSE e \in {x \in 1..3 : x > 1} : TRUE)
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
