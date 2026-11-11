(*---
description: Evaluates a random set expression, seed 262, number 7663.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07663 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({((1 :> 2))[3], (FALSE % -1)} \ UNION {{1, 1}, {b11795 \in {1, 2} : FALSE}}) \ (DOMAIN (3 :> 3) \cup {LET b11796 == 7 IN <<>>, (7 * 2)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07663 failed.
    Attempted to apply function:
    <<2>>
    to argument 3, which is not in the domain of the function.
---*)
