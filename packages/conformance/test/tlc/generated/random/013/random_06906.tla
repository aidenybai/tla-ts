(*---
description: Evaluates a random bool expression, seed 262, number 6906.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06906 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len(SortSeq([<<1>> EXCEPT ![1] = 2147483647], LAMBDA p, q : p < q)) \in {IF (2..1 = {}) THEN (0 % 3) ELSE ([a |-> 1, b |-> TRUE] + 3), CASE SelectSeq(<<5, 6>>, LAMBDA e : e > 0) -> ([x \in 1..2 |-> x])[7] [] OTHER -> (-[a |-> 1])}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06906 failed.
    A non-boolean expression (a tuple) was used as a condition of a CASE. line 14, col 157 to line 14, col 193 of module random_06906
---*)
