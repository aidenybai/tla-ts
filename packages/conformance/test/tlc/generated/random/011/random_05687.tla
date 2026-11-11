(*---
description: Evaluates a random int expression, seed 262, number 5687.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05687 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality(({b8764 \in UNION {{1, 2}, {1}} : (b8764 = 0)} \ (CHOOSE f \in [1..2 -> {1, 2}] : TRUE))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
