(*---
description: Evaluates a random set expression, seed 262, number 7865.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07865 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([a |-> Cardinality({x \in 1..3 : x > 1}), b |-> (TRUE <=> FALSE)]).a .. (Len(SubSeq(<<1, 2>>, TRUE, FALSE)) * IF (<<1, 2>> = [x \in 1..2 |-> x]) THEN CASE FALSE -> 1 [] OTHER -> 2147483647 ELSE CASE TRUE -> 0 [] OTHER -> [a |-> 1, b |-> TRUE])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07865 failed.
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    TRUE
---*)
