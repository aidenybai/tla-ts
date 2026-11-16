(*---
description: Evaluates a random seq expression, seed 262, number 6581.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06581 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SubSeq(SortSeq((<<>> \o <<>>), LAMBDA p, q : p < q), [SelectSeq(<<1>>, LAMBDA e : e > 0) EXCEPT ![1] = ([a |-> 1, b |-> TRUE]).a], Head(<<3, -1>>)) \o (({b10108 \in Nat : FALSE} \ UNION {1..3, Nat}) \o SelectSeq(SelectSeq(<<>>, LAMBDA e : e > 0), LAMBDA e : e > 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06581 failed.
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    <<1>>
---*)
