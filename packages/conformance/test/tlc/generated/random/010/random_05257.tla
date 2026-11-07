(*---
description: Evaluates a random bool expression, seed 262, number 5257.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05257 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE r \in [a : 2..1] : TRUE) = [(CHOOSE r \in [a : {2, 1, 3}] : TRUE) EXCEPT !.a = @ + LET b8138 == (3 + 2) IN IF <<1>> THEN 2 ELSE 0]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05257 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 47 of module random_05257
---*)
