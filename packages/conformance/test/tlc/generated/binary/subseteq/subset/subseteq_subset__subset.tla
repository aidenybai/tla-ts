(*---
description: subseteq of subset, a SubsetValue, and subset, a SubsetValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_subset__subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SUBSET {1, 2}) \subseteq (SUBSET {1, 2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
