(*---
description: Evaluates a random record expression, seed 262, number 2359.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02359 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[[a |-> 1] EXCEPT !.a = 3] EXCEPT !.a = @ + (CHOOSE b3737 \in 2..1 : FALSE)] EXCEPT !.a = @ + ([[x \in 1..2 |-> x] EXCEPT ![7] = 7])[(CHOOSE b3738 \in {x \in 1..3 : x > 1} : FALSE)]] EXCEPT !.a = @ + ((CHOOSE f \in [{1, 2} \cap {2} -> {1, 2} \cap {2}] : TRUE))[((-0) - (CHOOSE b3739 \in 1..3 : TRUE))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02359 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 64 to line 14, col 92 of module random_02359
---*)
