(*---
description: Evaluates a random record expression, seed 262, number 9830.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09830 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ((CHOOSE b15260 \in (3 .. 3) : (FALSE <=> FALSE)) * ((CHOOSE b15261 \in SUBSET {1} : FALSE) * ([x \in Nat |-> x + 1] - 7))), b |-> ((CHOOSE r \in [a : {}] : TRUE) = [a |-> ([x \in 1..2 |-> x])[2147483647], b |-> (\E b15262 \in SUBSET {1} : FALSE)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09830 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 77 to line 14, col 112 of module random_09830
---*)
