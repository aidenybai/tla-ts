(*---
description: Evaluates a random int expression, seed 262, number 5683.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05683 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF ([(CHOOSE r \in [a : {2, 1, 3}] : TRUE) EXCEPT !.a = @ + Cardinality({x \in 1..3 : x > 1})] = [[[a |-> 1, b |-> TRUE] EXCEPT !.a = 7] EXCEPT !.a = LET b8754 == 7 IN 1]) THEN (LET b8755 == (2 + 2) IN Head(<<3, 1, 2>>) * IF (FALSE <=> FALSE) THEN (-1 + 2147483647) ELSE (3 + 1)) ELSE ((CHOOSE r \in [a : 2..1] : TRUE)).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05683 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 303 to line 14, col 332 of module random_05683
---*)
