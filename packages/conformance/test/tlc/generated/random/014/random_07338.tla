(*---
description: Evaluates a random bool expression, seed 262, number 7338.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07338 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE b11293 \in (1..3 \ {2, 1, 3}) : (2 < b11293)) .. ((3 \div {}) + LET b11294 == 2147483647 IN 1)) \subseteq (LET b11295 == [[a |-> 1] EXCEPT !.a = 1] IN IF TRUE THEN 7 ELSE 2147483647 .. ((3 * 7) \div Cardinality({2, 1, 3})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07338 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 69 of module random_07338
---*)
