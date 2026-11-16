(*---
description: Evaluates a random int expression, seed 262, number 9115.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09115 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([(CHOOSE r \in [a : {2, 1, 3}] : TRUE) EXCEPT !.a = (CHOOSE b14165 \in (2..1 \cap {2, 1, 3}) : (1..3 = Nat))]).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09115 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 70 to line 14, col 123 of module random_09115
---*)
