(*---
description: Evaluates a random record expression, seed 262, number 1339.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01339 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ((CHOOSE r \in [a : 1..2] : TRUE)).a, b |-> (~((\E b2142 \in {} : TRUE) \/ (7 \in {2, 1, 3})))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 1, b |-> TRUE]"
---*)
