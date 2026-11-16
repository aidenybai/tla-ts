(*---
description: Evaluates a random int expression, seed 262, number 3152.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03152 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[(CHOOSE r \in [a : {}] : TRUE) EXCEPT !.a = @ + IF TRUE THEN 2 ELSE 2147483647] EXCEPT !.a = @ + ([[a |-> 1] EXCEPT !.a = @ + 2]).a]).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03152 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 20 to line 14, col 47 of module random_03152
---*)
