(*---
description: Evaluates a random int expression, seed 262, number 262.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00262 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head([<<Head(<<1, 2>>), (-2)>> EXCEPT ![1] = (CHOOSE f \in [{1, 2} \cap {2} -> 1..2] : TRUE)]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (2 :> 1)"
---*)
