(*---
description: Evaluates a random bool expression, seed 262, number 2757.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02757 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Tail(Append([<<1>> EXCEPT ![1] = -1], <<7, 7>>)) = (CHOOSE f \in [{1, 2} \ {1} -> {2, 1, 3}] : TRUE)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
