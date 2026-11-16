(*---
description: Evaluates a random seq expression, seed 262, number 2645.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02645 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(Append(SelectSeq(Append(<<>>, 7), LAMBDA e : e > 0), ([[a |-> 1] EXCEPT !.a = @ + -1]).a), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<0, 7>>"
---*)
