(*---
description: Evaluates a random int expression, seed 262, number 5124.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05124 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(Append(SubSeq(Append(<<3, 1, 2>>, 2), (2147483647 - 2), LET b7968 == 2147483647 IN -1), ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 1]).a)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
