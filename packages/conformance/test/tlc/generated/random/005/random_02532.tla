(*---
description: Evaluates a random int expression, seed 262, number 2532.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02532 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([[a |-> 0, b |-> TRUE] EXCEPT !.a = Len(<<1, 2>>)]).a + ((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)).a))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 4"
---*)
