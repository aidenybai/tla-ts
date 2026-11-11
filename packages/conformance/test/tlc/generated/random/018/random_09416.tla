(*---
description: Evaluates a random seq expression, seed 262, number 9416.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09416 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<([[[a |-> 1, b |-> TRUE] EXCEPT !.a = 3] EXCEPT !.a = @ + Len(<<1, 2>>)]).a, Head(SortSeq(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0), LAMBDA p, q : p < q))>>)
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<5, 1>>"
---*)
