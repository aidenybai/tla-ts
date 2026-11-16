(*---
description: Evaluates a random seq expression, seed 262, number 5695.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05695 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b8771 == Cardinality(UNION {[a |-> 3, b |-> TRUE], {b8772 \in {} : FALSE}}) IN (IF (FALSE /\ b8771) THEN (2 * <<3, 1, 2>>) ELSE Head(<<1>>) % (Cardinality(SUBSET {1}) * (3 \div 2))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
