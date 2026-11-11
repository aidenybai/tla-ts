(*---
description: map_over applied to set_filter, a SetPredValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_sso
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE map_over_set_filter ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({e : e \in {x \in 1..3 : x > 1}})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {2, 3}"
---*)
