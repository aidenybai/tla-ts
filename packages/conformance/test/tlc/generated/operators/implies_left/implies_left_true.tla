(*---
description: implies_left applied to true, a BoolValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_implies
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE implies_left_true ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(TRUE => TRUE)
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
