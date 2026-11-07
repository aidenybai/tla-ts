(*---
description: Evaluates a random set expression, seed 262, number 5651.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05651 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality(UNION {DOMAIN [x \in 1..2 |-> x], {b8729 : b8729 \in {x \in 1..3 : x > 1}}}) .. (SubSeq(Tail(<<1, 2>>), IF TRUE THEN <<>> ELSE 3, CASE FALSE -> 2 [] OTHER -> 7) \o [Tail(<<3, 1, 2>>) EXCEPT ![1] = Head(<<3, 1, 2>>)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    <<>>
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    <<>>
---*)
