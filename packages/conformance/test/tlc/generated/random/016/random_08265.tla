(*---
description: Evaluates a random bool expression, seed 262, number 8265.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08265 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Tail(<<IF FALSE THEN 1 ELSE 2147483647, (0 + 1)>>) = (CHOOSE f \in [{2, 1, 3} -> {2, 1, 3}] : TRUE)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
