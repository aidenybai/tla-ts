(*---
description: and_right applied to true, a BoolValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_land
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE and_right_true ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(TRUE /\ TRUE)
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
