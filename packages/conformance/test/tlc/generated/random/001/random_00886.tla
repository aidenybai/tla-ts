(*---
description: Evaluates a random function expression, seed 262, number 886.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00886 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE f \in [1..2 -> {1, 2}] : TRUE))[((7 :> 1))[(FALSE \/ FALSE)]] :> CASE ((CHOOSE b1432 \in {} : TRUE) = (CHOOSE b1433 \in 2..1 : FALSE)) -> (<<3, 3>> % Len(<<3, 1, 2>>)) [] OTHER -> ([[a |-> 1] EXCEPT !.a = @ + 1]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00886 failed.
    Attempted to check equality of integer 7 with non-integer:
    FALSE
---*)
