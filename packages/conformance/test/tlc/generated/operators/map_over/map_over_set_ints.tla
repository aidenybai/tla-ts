(*---
description: map_over applied to set_ints, a SetEnumValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_sso
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE map_over_set_ints ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({e : e \in {2, 1}})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1, 2}"
---*)
