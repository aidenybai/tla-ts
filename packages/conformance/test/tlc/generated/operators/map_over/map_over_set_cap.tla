(*---
description: map_over applied to set_cap, a SetCapValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_sso
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE map_over_set_cap ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({e : e \in {1, 2} \cap {2, 3}})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {2}"
---*)
