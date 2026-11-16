(*---
description: Evaluates a random int expression, seed 262, number 6249.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06249 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality({b9627 \in {2, 7} : (FALSE /\ TRUE)}) - (Len(SelectSeq(<<1>>, LAMBDA e : e > 0)) * LET b9628 == (7 + 2) IN (1 + b9628))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -10"
---*)
