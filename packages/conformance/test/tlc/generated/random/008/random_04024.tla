(*---
description: Evaluates a random seq expression, seed 262, number 4024.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04024 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(Tail([SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q) EXCEPT ![1] = ([a |-> 1]).a]), Len([(<<1>> \o <<3, 1, 2>>) EXCEPT ![1] = ([a |-> 1, b |-> TRUE]).a])))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, 3, 4>>"
---*)
