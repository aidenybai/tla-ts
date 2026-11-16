(*---
description: Evaluates a random int expression, seed 262, number 4411.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04411 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b6941 \in [[a |-> 2147483647, b |-> TRUE] EXCEPT !.a = (-7)] : ((CHOOSE b6942 \in {1, 2} : TRUE) = LET b6943 == 7 IN 3)) + (-((<<5, 6>>)[0] - ([x \in Nat |-> x + 1])[7]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04411 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 18 to line 14, col 143 of module random_04411
---*)
