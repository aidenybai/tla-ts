(*---
description: Evaluates a random bool expression, seed 262, number 2122.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02122 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE r \in [a : {}] : TRUE) = [<<([x \in Nat |-> x + 1])[0], Head(<<>>)>> EXCEPT !.a = @ + ((CHOOSE b3365 \in {2, 1, 3} : TRUE) - (7 % 1))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02122 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 45 of module random_02122
---*)
