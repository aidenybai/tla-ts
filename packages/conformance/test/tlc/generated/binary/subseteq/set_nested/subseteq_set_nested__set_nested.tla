(*---
description: subseteq of set_nested, a SetEnumValue, and set_nested, a SetEnumValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_set_nested__set_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({{1}, {}}) \subseteq ({{1}, {}}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
