(*---
description: Evaluates a random set expression, seed 262, number 7082.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07082 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Head(Tail(SortSeq(<<1, 2>>, LAMBDA p, q : p < q))), LET b10876 == (LET b10877 == -1 IN b10877 - Head(<<3, 1, 2>>)) IN (([a |-> 1]).a % ([a |-> 1, b |-> TRUE]).a)})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {0, 2}"
---*)
