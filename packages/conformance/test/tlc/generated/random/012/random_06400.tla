(*---
description: Evaluates a random seq expression, seed 262, number 6400.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06400 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SelectSeq(Append(Append(<<1>>, 1), Len(<<>>)), LAMBDA e : e > 0) EXCEPT ![1] = (IF (0 < 3) THEN (7 * 1) ELSE [a |-> 2, b |-> FALSE] - Head(SortSeq(<<>>, LAMBDA p, q : p < q)))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<7, 1>>"
---*)
