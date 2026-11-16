(*---
description: Evaluates a random function expression, seed 262, number 1150.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01150 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b1842 == ([a |-> 1, b |-> FALSE]).a IN ((CHOOSE f \in [{1} -> {1, 2}] : TRUE))[([a |-> 1]).a] :> Len(<<Head(<<1>>), ([a |-> 1, b |-> TRUE]).a>>)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2>>"
---*)
