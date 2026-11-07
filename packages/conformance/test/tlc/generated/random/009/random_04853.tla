(*---
description: Evaluates a random bool expression, seed 262, number 4853.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04853 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE f \in [{0} \cup {1} -> {2, 1, 3}] : TRUE))[Len(Tail(<<>>))] < ([[[a |-> 1, b |-> TRUE] EXCEPT !.a = 3] EXCEPT !.a = Len(<<>>)]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
