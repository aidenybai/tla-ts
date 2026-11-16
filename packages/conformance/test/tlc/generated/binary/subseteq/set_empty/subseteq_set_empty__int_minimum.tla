(*---
description: subseteq of set_empty, a SetEnumValue, and int_minimum, a IntValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_set_empty__int_minimum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \subseteq ((-2147483647 - 1)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
