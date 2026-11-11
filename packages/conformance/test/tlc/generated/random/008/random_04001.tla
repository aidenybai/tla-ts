(*---
description: Evaluates a random seq expression, seed 262, number 4001.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04001 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(Tail(<<(1 \div 7), (1 * 2)>>), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2>>"
---*)
