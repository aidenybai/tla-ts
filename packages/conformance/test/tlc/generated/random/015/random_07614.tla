(*---
description: Evaluates a random record expression, seed 262, number 7614.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07614 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : 2..1] : TRUE) EXCEPT !.a = (([a |-> 1, b |-> TRUE]).a \div {7 : b11712 \in {1}})] EXCEPT !.a = (LET b11713 == (7 * 7) IN <<b11713, b11713>> % Cardinality(UNION {2..1, {1, 2}}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07614 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 48 of module random_07614
---*)
