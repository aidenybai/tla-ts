(*---
description: subseteq of union, a UnionValue, and interval, a IntervalValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_union__interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {{1}, {2}}) \subseteq (1..3))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
