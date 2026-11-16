(*---
description: subseteq_left applied to set_map, a SetEnumValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_left_set_map ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({x + 1 : x \in 1..2} \subseteq {1, 2})
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
