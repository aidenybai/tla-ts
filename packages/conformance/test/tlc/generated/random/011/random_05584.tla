(*---
description: Evaluates a random int expression, seed 262, number 5584.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05584 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-LET b8649 == ((3 - -1) * (CHOOSE b8650 \in {x \in 1..3 : x > 1} : FALSE)) IN ([[x \in 1..2 |-> x] EXCEPT ![<<1, 2>>] = 2147483647])[(b8649 * 3)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05584 failed.
    Attempted to check if the value:
    <<1, 2>>
    is in the integer interval 1..2
---*)
