(*---
description: Evaluates a random seq expression, seed 262, number 9652.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09652 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(Tail([Tail(<<3, 1, 2>>) EXCEPT ![1] = LET b14989 == [x \in 1..2 |-> x] IN 2]), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2>>"
---*)
