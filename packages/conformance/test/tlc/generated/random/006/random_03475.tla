(*---
description: Evaluates a random set expression, seed 262, number 3475.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03475 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN Len(<<2, 2147483647>>) \cap DOMAIN ([(1 :> 2) EXCEPT ![1..3] = 0] @@ (-1 :> 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03475 failed.
    Attempted to apply the operator DOMAIN to a non-function
    (an integer)
    line 14, col 17 to line 14, col 45 of module random_03475
---*)
