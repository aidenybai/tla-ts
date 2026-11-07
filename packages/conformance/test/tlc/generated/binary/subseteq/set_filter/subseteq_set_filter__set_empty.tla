(*---
description: subseteq of set_filter, a SetPredValue, and set_empty, a SetEnumValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_set_filter__set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({x \in 1..3 : x > 1}) \subseteq ({}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
