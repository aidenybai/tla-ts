(*---
description: Evaluates a random bool expression, seed 262, number 8299.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08299 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[[a |-> 1, b |-> TRUE] EXCEPT !.a = 7] EXCEPT !.a = LET b12842 == 1 IN 2] EXCEPT !.a = @ + (CHOOSE b12843 \in (2..1 \cap {x \in 1..3 : x > 1}) : (FALSE => TRUE))] EXCEPT !.a = (LET b12844 == (2 % 7) IN ([a |-> 1]).a + (((1 :> 2))[2147483647] - ([a |-> 1])[3]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08299 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 111 to line 14, col 178 of module random_08299
---*)
