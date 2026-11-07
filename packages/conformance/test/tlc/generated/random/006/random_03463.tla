(*---
description: Evaluates a random int expression, seed 262, number 3463.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03463 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([a |-> ([a |-> 1, b |-> TRUE]).a, b |-> (2 \in 1..3)]).a + LET b5480 == Len(Append(<<>>, 1)) IN CASE ([a |-> 1] = [a |-> 1]) -> (b5480 \div 0) [] OTHER -> Cardinality(Nat)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
---*)
