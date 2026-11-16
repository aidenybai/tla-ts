(*---
description: Evaluates a random record expression, seed 262, number 4321.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04321 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {}] : TRUE) EXCEPT !.a = LET b6811 == ((2 % 0) + DOMAIN [x \in Nat |-> x + 1]) IN (((1 :> 2))[[a |-> 1]] % ([a |-> 1]).a)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04321 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 45 of module random_04321
---*)
