(*---
description: Evaluates a random int expression, seed 262, number 3427.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03427 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len((<<7, 0>> \o SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q))) + SelectSeq(DOMAIN ((1 :> 2) @@ [x \in 1..2 |-> x]), LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    {1, 2}
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    {1, 2}
---*)
