(*---
description: Evaluates a random function expression, seed 262, number 5106.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05106 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b7942 \in (SortSeq(SelectSeq([a |-> 1, b |-> TRUE], LAMBDA e : e > 0), LAMBDA p, q : p < q) \cap ({0, 2} \cup {b7943 \in {1, 2} : FALSE})) |-> Len(<<(2..1 * b7942), LET b7944 == 2147483647 IN 2147483647>>)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    [a |-> 1, b |-> TRUE]
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    [a |-> 1, b |-> TRUE]
---*)
