(*---
description: equiv applied to false, a BoolValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_equiv
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equiv_false ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(FALSE <=> TRUE)
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
