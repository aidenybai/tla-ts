(*---
description: Evaluates a random record expression, seed 262, number 7358.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07358 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[(CHOOSE r \in [a : 2..1] : TRUE) EXCEPT !.a = @ + IF TRUE THEN 7 ELSE TRUE] EXCEPT !.a = ((3 - 1) - (2147483647 * 3))] EXCEPT !.a = @ + (CASE (3 = 2) -> CASE FALSE -> -1 [] OTHER -> -1 [] OTHER -> LET b11320 == 2 IN <<1, 2>> \div LET b11321 == (2147483647 % 2) IN Cardinality({1, 2}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07358 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 20 to line 14, col 49 of module random_07358
---*)
