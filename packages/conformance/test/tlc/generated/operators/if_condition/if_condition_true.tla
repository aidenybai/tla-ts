(*---
description: if_condition applied to true, a BoolValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_ite
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE if_condition_true ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF TRUE THEN 1 ELSE 2)
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
