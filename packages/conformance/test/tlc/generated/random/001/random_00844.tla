(*---
description: Evaluates a random set expression, seed 262, number 844.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00844 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF ((3 \in {}) /\ (FALSE <=> FALSE)) THEN IF (FALSE /\ TRUE) THEN Head(<<3, 1, 2>>) ELSE (-0) ELSE ((0 + 1) \div (0 \div 1)) .. ((-Len(<<1, 2>>)) \div (((1 :> 2) @@ <<5, 6>>))[(-[a |-> 1])])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
---*)
