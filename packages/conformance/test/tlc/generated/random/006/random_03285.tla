(*---
description: Evaluates a random bool expression, seed 262, number 3285.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03285 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((([x \in 1..2 |-> x] @@ <<>>) @@ (-1 :> 3)) \cup DOMAIN (CHOOSE f \in [{1} -> {1, 2}] : TRUE)) = {((0 + 3) - (-1 - 7)), (-(<<5, 6>>)[-1])}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03285 failed.
    Attempted to access index -1 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
