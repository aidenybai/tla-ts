(*---
description: Evaluates a random seq expression, seed 262, number 770.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00770 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SortSeq(SelectSeq(Append(<<3, 1, 2>>, 7), LAMBDA e : e > 0), LAMBDA p, q : p < q) \o (Tail((<<1>> \o <<1>>)) \o [SubSeq(<<3, 1, 2>>, 7, [a |-> 1]) EXCEPT ![1] = (3 % 7)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The third argument of SubSeq should be a natural number, but instead it is:
    [a |-> 1]
    2169:0 The third argument of SubSeq should be a natural number, but instead it is:
    [a |-> 1]
---*)
