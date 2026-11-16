(*---
description: Evaluates a random bool expression, seed 262, number 5696.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05696 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((([a |-> 1]).a :> Head(<<1>>)))[((2 - 3) * ([a |-> 1]).a)] < ((CASE TRUE -> -1 [] OTHER -> 0 - (-2147483647)) + Cardinality((CHOOSE r \in [a : {1}] : TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05696 failed.
    Attempted to apply function:
    <<1>>
    to argument -1, which is not in the domain of the function.
---*)
