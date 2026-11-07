(*---
description: Evaluates a random int expression, seed 262, number 8373.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08373 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF ((\A b12952 \in 3 : FALSE) /\ (\A b12953 \in {1} : FALSE)) THEN (Head(<<1>>) * (3 - 2)) ELSE (([x \in 1..2 |-> x] @@ <<5, 6>>))[IF TRUE THEN 7 ELSE 2147483647] % Head(SortSeq(SortSeq(<<1, 2>>, LAMBDA p, q : p < q), LAMBDA p, q : p < q))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08373 failed.
    TLC encountered a non-enumerable quantifier bound
    3.
    3
---*)
