(*---
description: Evaluates a random record expression, seed 262, number 660.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00660 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> Len(SortSeq([<<1>> EXCEPT ![1] = -1], LAMBDA p, q : p < q)), b |-> (LET b1100 == (-7) IN Cardinality({x \in 1..3 : x > 1}) < Len(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q)))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 1, b |-> TRUE]"
---*)
