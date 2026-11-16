(*---
description: Evaluates a random int expression, seed 262, number 429.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00429 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([[a |-> 7, b |-> FALSE] EXCEPT !.a = @ + (CHOOSE b700 \in {1, 2} : FALSE)]).a + (-(IF {1, 2} THEN 2 ELSE 3 + (2 \div 2147483647)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00429 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 60 to line 14, col 89 of module random_00429
---*)
