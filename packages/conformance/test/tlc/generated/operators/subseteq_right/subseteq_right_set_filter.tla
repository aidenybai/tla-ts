(*---
description: subseteq_right applied to set_filter, a SetPredValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_right_set_filter ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({1} \subseteq {x \in 1..3 : x > 1})
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
