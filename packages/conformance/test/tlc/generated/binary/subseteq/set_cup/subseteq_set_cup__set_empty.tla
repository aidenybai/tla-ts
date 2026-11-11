(*---
description: subseteq of set_cup, a SetCupValue, and set_empty, a SetEnumValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_set_cup__set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1} \cup {2}) \subseteq ({}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
