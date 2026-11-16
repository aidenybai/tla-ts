(*---
description: Evaluates a random int expression, seed 262, number 9448.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09448 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([(IF TRUE THEN 7 ELSE 3 :> (-1)) EXCEPT ![IF (FALSE => FALSE) THEN Len(<<>>) ELSE Len(<<1>>)] = Head(SelectSeq(<<1>>, LAMBDA e : e > 0))])[(((\E b14664 \in 2..1 : [x \in Nat |-> x + 1]) :> (-1 % 7)))[(([x \in Nat |-> x + 1])[2] + (7 * 1))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09448 failed.
    Attempted to apply EXCEPT construct to the value 7.
---*)
