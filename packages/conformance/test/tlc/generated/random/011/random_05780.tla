(*---
description: Evaluates a random bool expression, seed 262, number 5780.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05780 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Tail(Tail(Append(<<1, 2>>, 0))) = [([<<5, 6>> EXCEPT ![2147483647] = {x \in 1..3 : x > 1}] @@ [[x \in 1..2 |-> x] EXCEPT ![1] = 3]) EXCEPT ![(IF TRUE THEN 7 ELSE 0 \div (-1 - 1))] = SubSeq(SortSeq(<<1>>, LAMBDA p, q : p < q), (-1 - -1), LET b8908 == 1 IN b8908)]))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 54 to line 14, col 61 of module random_05780
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 53 to line 14, col 146 of module random_05780
    | FALSE
---*)
