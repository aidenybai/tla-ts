(*---
description: Evaluates a random int expression, seed 262, number 5329.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05329 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b8242 == ([[[a |-> 1] EXCEPT !.a = @ + 1] EXCEPT !.a = Len(<<3, 1, 2>>)]).a IN Len(SortSeq(<<3, b8242>>, LAMBDA p, q : p < q)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
