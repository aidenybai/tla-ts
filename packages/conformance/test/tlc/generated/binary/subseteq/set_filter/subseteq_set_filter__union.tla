(*---
description: subseteq of set_filter, a SetPredValue, and union, a UnionValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_set_filter__union ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({x \in 1..3 : x > 1}) \subseteq (UNION {{1}, {2}}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
