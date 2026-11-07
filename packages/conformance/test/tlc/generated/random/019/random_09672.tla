(*---
description: Evaluates a random function expression, seed 262, number 9672.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09672 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[b15010 \in ((1 :> 2) @@ <<5, 6>>) |-> {b15010, 0}] EXCEPT ![(-(-7))] = Len([<<>> EXCEPT ![1] = 1])] @@ (CHOOSE f \in [1..2 -> {1}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09672 failed.
    Attempted to check if the value:
    7
    is an element of the function <<2, 6>>
---*)
