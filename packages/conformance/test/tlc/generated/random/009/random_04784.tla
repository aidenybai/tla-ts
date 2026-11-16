(*---
description: Evaluates a random record expression, seed 262, number 4784.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04784 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (([[x \in 1..2 |-> x] EXCEPT ![1] = 2])[(CHOOSE b7469 \in {x \in 1..3 : x > 1} : FALSE)] % ([[a |-> 1] EXCEPT !.a = @ + 7] - ([a |-> 1, b |-> TRUE]).a)), b |-> (((2 * 3) = Cardinality({1})) \/ ((0 % FALSE) < ([a |-> 1, b |-> TRUE]).a))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04784 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 64 to line 14, col 108 of module random_04784
---*)
