(*---
description: Evaluates a random seq expression, seed 262, number 3470.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03470 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail([Tail(SortSeq(<<1, 2>>, LAMBDA p, q : p < q)) EXCEPT ![1] = (IF FALSE THEN 1 ELSE 7 * Cardinality(2..1))]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
