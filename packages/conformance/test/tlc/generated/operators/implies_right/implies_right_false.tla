(*---
description: implies_right applied to false, a BoolValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_implies
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE implies_right_false ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(TRUE => FALSE)
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
