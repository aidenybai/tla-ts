(*---
description: Evaluates a random bool expression, seed 262, number 7397.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07397 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~(([a |-> -1, b |-> FALSE] = [[a |-> 1] EXCEPT !.a = 1]) \/ ((<<1>> \o <<1, 2>>) = {-1 : b11394 \in 1..3}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07397 failed.
    Attempted to check equality of the function <<1, 1, 2>> with the value:
    {-1}
---*)
