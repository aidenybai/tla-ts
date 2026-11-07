(*---
description: Evaluates a random seq expression, seed 262, number 2597.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02597 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([SelectSeq([<<1>> EXCEPT ![1] = 3], LAMBDA e : e > 0) EXCEPT ![1] = Cardinality({3, 2147483647})] \o (Tail((<<3, 1, 2>> \o <<1, 2>>)) \o (SortSeq(<<1, 2>>, LAMBDA p, q : p < q) \o SelectSeq([a |-> 1, b |-> TRUE], LAMBDA e : e > 0)))))
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
