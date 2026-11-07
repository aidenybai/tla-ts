(*---
description: Evaluates a random seq expression, seed 262, number 6441.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06441 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SortSeq(Append(Tail(<<>>), ([x \in Nat |-> x + 1])[2147483647]), LAMBDA p, q : p < q) \o <<(Len(<<3, 1, 2>>) * IF FALSE THEN 2 ELSE 2), ((1 % 2147483647) * LET b9910 == 2147483647 IN 2147483647)>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
