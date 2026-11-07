(*---
description: Evaluates a random bool expression, seed 262, number 4333.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04333 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE f \in [{0} \cup {1} -> 1..2] : TRUE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (0 :> 1 @@ 1 :> 1)"
---*)
