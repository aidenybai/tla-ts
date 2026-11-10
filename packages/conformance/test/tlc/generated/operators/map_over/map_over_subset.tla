(*---
description: map_over applied to subset, a SubsetValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_sso
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE map_over_subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({e : e \in SUBSET {1, 2}})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {{}, {1}, {2}, {1, 2}}"
---*)
