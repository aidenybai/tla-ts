(*---
description: Evaluates a random record expression, seed 262, number 2642.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02642 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[a |-> 3, b |-> [a |-> 1, b |-> TRUE]] EXCEPT !.a = @ + IF FALSE THEN 2147483647 ELSE 3] EXCEPT !.a = @ + ((CHOOSE r \in [a : 2..1] : TRUE)).a] EXCEPT !.a = @ + ((CHOOSE f \in [2..1 -> {2, 1, 3}] : TRUE))[([[a |-> 1] EXCEPT !.a = 2147483647]).a]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02642 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 127 to line 14, col 156 of module random_02642
---*)
