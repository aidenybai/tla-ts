(*---
description: Evaluates a random bool expression, seed 262, number 4207.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04207 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) = [[[[a |-> 1] EXCEPT !.a = @ + 3] EXCEPT !.a = [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 7]] EXCEPT !.a = IF (TRUE /\ TRUE) THEN (CHOOSE b6613 \in 1..3 : FALSE) ELSE CASE TRUE -> 1 [] OTHER -> 2]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04207 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 190 to line 14, col 218 of module random_04207
---*)
