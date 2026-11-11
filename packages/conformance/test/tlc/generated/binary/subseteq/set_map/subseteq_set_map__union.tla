(*---
description: subseteq of set_map, a SetEnumValue, and union, a UnionValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_set_map__union ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({x + 1 : x \in 1..2}) \subseteq (UNION {{1}, {2}}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
