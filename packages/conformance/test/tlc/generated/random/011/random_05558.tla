(*---
description: Evaluates a random seq expression, seed 262, number 5558.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05558 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(({(-2147483647) : b8607 \in ({1, 2} \cup 1..3)} \cup ({2147483647 : b8608 \in {2, 1, 3}} \cup ({} \cup {}))), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05558 failed.
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    {-2147483647, 2147483647}
---*)
