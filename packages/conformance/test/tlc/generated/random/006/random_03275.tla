(*---
description: Evaluates a random int expression, seed 262, number 3275.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03275 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([b5209 \in ({x \in 1..3 : x > 1} \ {1}) |-> CASE TRUE -> 1 [] OTHER -> b5209])[(CASE FALSE -> 2 [] OTHER -> -1 * CASE FALSE -> 2147483647 [] OTHER -> -1)] - ([[a |-> {1}, b |-> FALSE] EXCEPT !.a = @ + LET b5210 == -1 IN 2]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03275 failed.
    In applying the function
    (2 :> 1 @@ 3 :> 1),
    the first argument is:
    1
    which is not in its domain.
---*)
