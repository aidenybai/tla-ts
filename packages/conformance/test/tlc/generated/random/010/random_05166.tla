(*---
description: Evaluates a random record expression, seed 262, number 5166.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05166 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (((CHOOSE f \in [1..2 -> {2, 1, 3}] : TRUE))[(-1 - -1)] * Head([<<1, 2>> EXCEPT ![1] = 2])), b |-> ((<<1..3, 0>> = (CHOOSE f \in [1..2 -> 2..1] : TRUE)) => (({1, 2} \ {1, 2}) = ({2, 1, 3} \cup 2..1)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05166 failed.
    Attempted to apply function:
    <<1, 1>>
    to argument 0, which is not in the domain of the function.
---*)
