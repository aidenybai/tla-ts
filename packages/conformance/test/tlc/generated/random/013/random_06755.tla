(*---
description: Evaluates a random int expression, seed 262, number 6755.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06755 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(SortSeq(Tail(<<>>), LAMBDA p, q : p < q)) * ((CHOOSE r \in [a : {0} \cup {1}] : TRUE)).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
