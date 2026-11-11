(*---
description: subseteq of subset, a SubsetValue, and set_nested, a SetEnumValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_subset__set_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SUBSET {1, 2}) \subseteq ({{1}, {}}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
