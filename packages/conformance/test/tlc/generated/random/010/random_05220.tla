(*---
description: Evaluates a random seq expression, seed 262, number 5220.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05220 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<([[a |-> 3, b |-> FALSE] EXCEPT !.a = @ + LET b8095 == 1 IN 3]).a, Head([SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q) EXCEPT ![1] = (2 + 2)])>>)
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<6, 4>>"
---*)
