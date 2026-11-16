(*---
description: Evaluates a random seq expression, seed 262, number 211.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00211 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(<<Head([[a |-> 1, b |-> TRUE] EXCEPT !.a = 0]), CASE (TRUE => FALSE) -> Len(<<3, 1, 2>>) [] OTHER -> Cardinality(SUBSET {1})>>, LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00211 failed.
    2283:0 The argument of Head should be a sequence, but instead it is:
    [a |-> 0, b |-> TRUE]
---*)
