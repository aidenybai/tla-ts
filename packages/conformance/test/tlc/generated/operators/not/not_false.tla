(*---
description: not applied to false, a BoolValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_lnot
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE not_false ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(~(FALSE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
