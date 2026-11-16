(*---
description: Evaluates a random record expression, seed 262, number 3789.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03789 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (((1..3 \subseteq SUBSET {1}) /\ (2 = 3)) * (-(-3))), b |-> (((TRUE \/ FALSE) /\ (~FALSE)) /\ ((<<>> \o <<3, 1, 2>>) = (CHOOSE f \in [2..1 -> {1, 2} \cap {2}] : TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03789 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
