(*---
description: case_guard applied to false, a BoolValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_case
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE case_guard_false ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE FALSE -> 1 [] OTHER -> 2)
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
