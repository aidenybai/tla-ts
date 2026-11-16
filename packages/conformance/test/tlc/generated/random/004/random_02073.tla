(*---
description: Evaluates a random int expression, seed 262, number 2073.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02073 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([[a |-> -1, b |-> FALSE] EXCEPT !.a = Cardinality(1..3)]).a % (IF (\A b3302 \in <<5, 6>> : FALSE) THEN Len(<<1>>) ELSE (-[x \in 1..2 |-> x]) % Cardinality({2 : b3303 \in 0}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02073 failed.
    TLC encountered a non-enumerable quantifier bound
    <<5, 6>>.
    line 14, col 98 to line 14, col 105 of module random_02073
---*)
