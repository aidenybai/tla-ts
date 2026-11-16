(*---
description: Evaluates a random set expression, seed 262, number 9143.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09143 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({Len(<<>>), ([a |-> 1, b |-> TRUE]).a} \cap (({1, 2} \cap 2..1) \cap ({x \in 1..3 : x > 1} \cap 2..1))) \cup (DOMAIN (CHOOSE f \in [2..1 -> 2..1] : TRUE) \cup UNION {{-1 : b14200 \in {1}}, {b14201 : b14201 \in {x \in 1..3 : x > 1}}})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {-1, 2, 3}"
---*)
