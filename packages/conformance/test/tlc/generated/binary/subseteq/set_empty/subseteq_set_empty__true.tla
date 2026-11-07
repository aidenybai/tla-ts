(*---
description: subseteq of set_empty, a SetEnumValue, and true, a BoolValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_set_empty__true ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \subseteq (TRUE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
