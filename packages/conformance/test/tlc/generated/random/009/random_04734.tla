(*---
description: Evaluates a random record expression, seed 262, number 4734.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04734 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1}] : TRUE) EXCEPT !.a = [a |-> CASE ([a |-> 1] = [a |-> 1]) -> ([a |-> 1]).a [] OTHER -> CASE TRUE -> 3 [] OTHER -> 3, b |-> ((CHOOSE b7400 \in {2, 1, 3} : FALSE) = (2147483647 \div 3))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04734 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 165 to line 14, col 198 of module random_04734
---*)
