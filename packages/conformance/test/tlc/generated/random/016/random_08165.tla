(*---
description: Evaluates a random int expression, seed 262, number 8165.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08165 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head((SortSeq(Tail(<<1>>), LAMBDA p, q : p < q) \o Append((<<1>> \o <<1, 2>>), IF TRUE THEN -1 ELSE 7))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
