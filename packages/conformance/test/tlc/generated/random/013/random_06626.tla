(*---
description: Evaluates a random int expression, seed 262, number 6626.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06626 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head((SelectSeq(SelectSeq(<<>>, LAMBDA e : e > 0), LAMBDA e : e > 0) \o SortSeq([<<1>> EXCEPT ![1] = 1], LAMBDA p, q : p < q))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
