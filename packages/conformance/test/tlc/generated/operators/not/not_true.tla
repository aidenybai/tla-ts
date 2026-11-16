(*---
description: not applied to true, a BoolValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_lnot
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE not_true ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(~(TRUE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
