(*---
description: subseteq_left applied to union, a UnionValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_left_union ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {{1}, {2}} \subseteq {1, 2})
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
