(*---
description: Evaluates a random record expression, seed 262, number 2848.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02848 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE f \in [{0} \cup {1} -> 1..2] : TRUE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (0 :> 1 @@ 1 :> 1)"
---*)
