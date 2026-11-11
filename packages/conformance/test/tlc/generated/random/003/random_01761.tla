(*---
description: Evaluates a random record expression, seed 262, number 1761.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01761 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (CHOOSE b2800 \in (DOMAIN (1 :> 2) \ {1, 2147483647}) : ((-1) < (-b2800))), b |-> ((CASE TRUE -> 7 [] OTHER -> 2 = (3 + 1)) \/ (DOMAIN [x \in 1..2 |-> x] \ ({} \cap [x \in 1..2 |-> x])))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01761 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 24 to line 14, col 95 of module random_01761
---*)
