(*---
description: Evaluates a random function expression, seed 262, number 449.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00449 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((IF TRUE THEN 2 ELSE 1 + IF TRUE THEN 7 ELSE TRUE) + Head(SortSeq(SUBSET {1}, LAMBDA p, q : p < q))) :> (LET b735 == ([a |-> 1, b |-> TRUE]).a IN (1..3 \cup {1, 2}) - (LET b736 == 7 IN b736 \div (2 + 7)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    {{}, {1}}
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    {{}, {1}}
---*)
