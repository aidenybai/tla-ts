(*---
description: map_over applied to set_of_records, a SetOfRcdsValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_sso
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE map_over_set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({e : e \in [a : {1, 2}]})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {[a |-> 1], [a |-> 2]}"
---*)
