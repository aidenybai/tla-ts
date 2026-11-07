(*---
description: Evaluates a random int expression, seed 262, number 1441.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01441 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(SubSeq(SubSeq(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q), (-1 + 2), (1 % 1)), ((2147483647 \div 0) \div (-2)), LET b2309 == (<<5, 6>> @@ [x \in Nat |-> x + 1]) IN Cardinality({1, 2}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
---*)
