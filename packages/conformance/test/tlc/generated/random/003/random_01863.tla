(*---
description: Evaluates a random record expression, seed 262, number 1863.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01863 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1}] : TRUE) EXCEPT !.a = @ + (CHOOSE b2939 \in (({1, 2} \cap Nat) \ (Nat \cap {1})) : ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + -1] = [[a |-> 1] EXCEPT !.a = 2]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01863 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 67 to line 14, col 196 of module random_01863
---*)
