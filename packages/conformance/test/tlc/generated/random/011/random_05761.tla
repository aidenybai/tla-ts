(*---
description: Evaluates a random bool expression, seed 262, number 5761.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05761 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((\E b8871 \in DOMAIN (CHOOSE f \in [1..2 -> 1..2] : TRUE) : (([a |-> 1]).a = Head(<<>>))) \/ (SubSeq(SortSeq(<<1>>, LAMBDA p, q : p < q), ([x \in 1..2 |-> x])[2], LET b8872 == 0 IN 1) = [[<<1, 2>> EXCEPT ![-1] = 2] EXCEPT ![IF FALSE THEN 1 ELSE 7] = Len(<<1>>)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
