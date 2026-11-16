(*---
description: Evaluates a random bool expression, seed 262, number 7250.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07250 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b11151 \in (<<2, -1>> \cap {b11152 \in SUBSET {1} : FALSE}) : ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 3] = [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + b11151])) \in (IF (TRUE => FALSE) THEN (CHOOSE b11153 \in 2..1 : FALSE) ELSE (2 + 7) \ (DOMAIN (1 :> 2) \cap (1..3 \cap {2, 1, 3})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07250 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 180 of module random_07250
---*)
