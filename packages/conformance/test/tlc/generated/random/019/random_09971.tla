(*---
description: Evaluates a random bool expression, seed 262, number 9971.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09971 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([IF (CHOOSE b15504 \in {x \in 1..3 : x > 1} : FALSE) THEN (3 - 7) ELSE CASE TRUE -> 3 [] OTHER -> 1 EXCEPT !.a = @ + ((3 % -1) - IF FALSE THEN 7 ELSE 1)] = [[[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + <<1, 2>>] EXCEPT !.a = @ + (0 - 2)] EXCEPT !.a = CASE (-1 = -1) -> LET b15505 == 3 IN b15505 [] OTHER -> CASE TRUE -> 1 [] OTHER -> 7]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09971 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 22 to line 14, col 67 of module random_09971
---*)
