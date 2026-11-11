(*---
description: Evaluates a random int expression, seed 262, number 6936.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06936 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(SortSeq(SelectSeq([<<3, 1, 2>> EXCEPT ![1] = 3], LAMBDA e : e > 0), LAMBDA p, q : p < q)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
