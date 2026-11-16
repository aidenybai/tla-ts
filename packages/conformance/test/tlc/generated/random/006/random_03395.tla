(*---
description: Evaluates a random seq expression, seed 262, number 3395.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03395 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(SortSeq([(<<1>> \o <<1>>) EXCEPT ![1] = IF FALSE THEN 0 ELSE 0], LAMBDA p, q : p < q)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1>>"
---*)
