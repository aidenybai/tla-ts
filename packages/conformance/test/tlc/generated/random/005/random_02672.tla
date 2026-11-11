(*---
description: Evaluates a random record expression, seed 262, number 2672.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02672 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {2, 1, 3}] : TRUE) EXCEPT !.a = LET b4221 == ((2 % 1) - Len(2147483647)) IN (Len(<<1, 2>>) \div (CHOOSE b4222 \in 1..3 : FALSE))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02672 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 133 to line 14, col 161 of module random_02672
---*)
