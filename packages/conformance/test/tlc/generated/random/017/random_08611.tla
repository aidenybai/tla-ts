(*---
description: Evaluates a random seq expression, seed 262, number 8611.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08611 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(Append(SelectSeq(<<1, 2>>, LAMBDA e : e > 0), ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + -1]).a), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<0, 1, 2>>"
---*)
