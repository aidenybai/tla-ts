(*---
description: Evaluates a random int expression, seed 262, number 4033.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04033 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b6340 \in {(IF FALSE THEN 2147483647 ELSE b6341 - Cardinality({2, 1, 3})) : b6341 \in ({-1, -1} \cap ({2, 1, 3} \cap {2, 1, 3}))} : (<<LET b6342 == b6340 IN b6340, (2 % b6340)>> = [[b6343 \in FALSE |-> -1] EXCEPT ![(2147483647 * b6340)] = IF TRUE THEN b6340 ELSE b6340])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04033 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 17 to line 14, col 293 of module random_04033
---*)
