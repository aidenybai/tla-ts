(*---
description: Evaluates a random bool expression, seed 262, number 5140.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05140 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE f \in [{0} \cup {1} -> {1}] : TRUE))[Cardinality(UNION {{1, 2}, 1..3})] = ((UNION {{2, 1, 3}, TRUE} @@ (2 :> 2147483647)))[([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 0]).a]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05140 failed.
    Attempted to apply function:
    (0 :> 1 @@ 1 :> 1)
    to argument 3, which is not in the domain of the function.
---*)
