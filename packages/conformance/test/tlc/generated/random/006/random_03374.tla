(*---
description: Evaluates a random bool expression, seed 262, number 3374.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03374 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b5353 \in (({} \cup 2..1) \ DOMAIN [x \in 1..2 |-> x]) : (CASE TRUE -> b5353 [] OTHER -> b5353 :> Len(<<1>>))) \in LET b5354 == (CHOOSE f \in [{1, 2} \cap {2} -> {1, 2} \cap {2}] : TRUE) IN ((CHOOSE b5355 \in 2..1 : FALSE) * CASE TRUE -> 3 [] OTHER -> 2)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03374 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 133 of module random_03374
---*)
