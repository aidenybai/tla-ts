(*---
description: Evaluates a random seq expression, seed 262, number 5237.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05237 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Tail(SortSeq(Append(<<1, 2>>, 7), LAMBDA p, q : p < q)) \o Tail(([<<3, 1, 2>> EXCEPT ![1] = 7] \o <<3, 1>>))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, 7, 1, 2, 3, 1>>"
---*)
