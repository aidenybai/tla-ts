(*---
description: Evaluates a random function expression, seed 262, number 8148.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08148 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CASE TRUE -> 2147483647 [] OTHER -> -1 \div Head(<<1, 2>>)) :> ((1 + 2) - Head(<<1>>))) @@ {b12599 \in ({b12600 : b12600 \in {x \in 1..3 : x > 1}} \ (Nat \cap {2, 1, 3})) : (\A b12601 \in ({1, 2} \ {1}) : (b12599 < 2))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08148 failed.
    2169:0 The second argument of @@ should be a function, but instead it is:
    {}
---*)
