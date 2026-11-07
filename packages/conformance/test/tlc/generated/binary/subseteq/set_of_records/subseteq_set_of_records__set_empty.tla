(*---
description: subseteq of set_of_records, a SetOfRcdsValue, and set_empty, a SetEnumValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_set_of_records__set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a : {1, 2}]) \subseteq ({}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
