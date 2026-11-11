(*---
description: Evaluates a random int expression, seed 262, number 3162.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03162 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF ((TRUE => FALSE) => (FALSE \/ FALSE)) THEN ((CHOOSE b5041 \in {1} : FALSE) % (-1 + 0)) ELSE ([a |-> -1, b |-> FALSE] = [[a |-> 1] EXCEPT !.a = 1]) * (((-1 * 1) % LET b5042 == FALSE IN b5042) + LET b5043 == Cardinality(1..3) IN IF FALSE THEN b5043 ELSE b5043)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03162 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 65 to line 14, col 92 of module random_03162
---*)
