(*---
description: Evaluates a random record expression, seed 262, number 9213.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09213 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (((CHOOSE b14299 \in {} : TRUE) % LET b14300 == 2 IN 2147483647) * LET b14301 == (-7) IN IF FALSE THEN 2 ELSE b14301), b |-> ([a |-> Head(<<1, 2>>), b |-> (FALSE \/ FALSE)] = (CHOOSE r \in [a : 2..1] : TRUE))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09213 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 26 to line 14, col 52 of module random_09213
---*)
