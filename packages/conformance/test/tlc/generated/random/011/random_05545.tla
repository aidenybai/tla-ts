(*---
description: Evaluates a random set expression, seed 262, number 5545.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05545 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN [b8577 \in ({7, 0} \ {b8578 : b8578 \in {1}}) |-> ([<<5, 6>> EXCEPT ![2] = 3])[(2147483647 % b8577)]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05545 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
