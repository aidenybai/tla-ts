(*---
description: or_left applied to true, a BoolValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_lor
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE or_left_true ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(TRUE \/ FALSE)
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
