(*---
description: Evaluates a random set expression, seed 262, number 9355.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09355 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN (IF TRUE THEN 2 ELSE (1 :> 2) :> (-2147483647)) \ ({b14523 \in (Nat \cup {x \in 1..3 : x > 1}) : (~1..3)} \cap UNION {(2 .. 7), UNION {{2, 1, 3}, 1..3}})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09355 failed.
    Attempted to apply the operator DOMAIN to a non-function
    (an integer)
    line 14, col 17 to line 14, col 70 of module random_09355
---*)
