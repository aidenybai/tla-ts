(*---
description: equiv applied to true, a BoolValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_equiv
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equiv_true ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(TRUE <=> TRUE)
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
