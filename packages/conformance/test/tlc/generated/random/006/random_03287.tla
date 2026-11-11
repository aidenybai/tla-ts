(*---
description: Evaluates a random record expression, seed 262, number 3287.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03287 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE b5228 \in {2, 0} : (Nat < [x \in 1..2 |-> x])) EXCEPT !.a = ((~FALSE) + ([x \in 1..2 |-> x] + 3))] EXCEPT !.a = @ + IF (((1 :> 2) * 0) \in {2, 1}) THEN (Len(<<1, 2>>) - Cardinality({1, 2})) ELSE (([x \in 1..2 |-> x] @@ <<5, 6>>))[(-0)]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03287 failed.
    2266:0 The first argument of < should be an integer, but instead it is:
    Nat
---*)
