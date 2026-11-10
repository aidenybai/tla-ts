(*---
description: Evaluates a random function expression, seed 262, number 5905.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05905 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b9106 == LET b9107 == ((-1 = -1) /\ ([a |-> 1] = [a |-> 1, b |-> TRUE])) IN (CHOOSE b9108 \in {b9109 \in {2, 1, 3} : FALSE} : <<b9108, b9108>>) IN (([[x \in 1..2 |-> x] EXCEPT ![b9106] = b9106] @@ [b9110 \in {x \in 1..3 : x > 1} |-> b9106]))[Head((<<>> \o <<1, 2>>))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05905 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 97 to line 14, col 161 of module random_05905
---*)
