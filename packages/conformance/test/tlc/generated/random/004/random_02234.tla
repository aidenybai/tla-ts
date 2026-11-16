(*---
description: Evaluates a random int expression, seed 262, number 2234.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02234 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(SubSeq(SortSeq([<<3, 1, 2>> EXCEPT ![1] = -1], LAMBDA p, q : p < q), (IF TRUE THEN 1 ELSE 0 % (3 - -1)), Head(([x \in 1..2 |-> x] @@ (1 :> 2))))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -1"
---*)
