(*---
description: Evaluates a random function expression, seed 262, number 5076.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05076 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [2..1 -> {2, 1, 3}] : TRUE) @@ SelectSeq([(<<1>> \o <<3, 1, 2>>) EXCEPT ![1] = Len(<<1, 2>>)], LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, 3, 1, 2>>"
---*)
