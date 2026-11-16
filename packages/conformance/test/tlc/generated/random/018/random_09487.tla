(*---
description: Evaluates a random bool expression, seed 262, number 9487.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09487 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([(CHOOSE b14736 \in 1..3 : FALSE) EXCEPT !.a = ([x \in 1..2 |-> x])[-1]] = [[a |-> 2, b |-> FALSE] EXCEPT !.a = (-[a |-> 1, b |-> TRUE])]) => ([[[a |-> 1] EXCEPT !.a = @ + 1] EXCEPT !.a = @ + LET b14737 == 2147483647 IN b14737] = [[a |-> 7, b |-> TRUE] EXCEPT !.a = ([a |-> 1, b |-> TRUE]).a])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09487 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 20 to line 14, col 49 of module random_09487
---*)
