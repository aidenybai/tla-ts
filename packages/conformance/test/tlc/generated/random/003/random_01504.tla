(*---
description: Evaluates a random seq expression, seed 262, number 1504.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01504 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(Tail(SortSeq([<<1, 2>> EXCEPT ![1] = 1], LAMBDA p, q : p < q)), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2>>"
---*)
