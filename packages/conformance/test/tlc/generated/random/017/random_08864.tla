(*---
description: Evaluates a random int expression, seed 262, number 8864.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08864 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> {([x \in 1..2 |-> x])[-1] : b13730 \in DOMAIN (1 :> 2)}, b |-> (([a |-> 1, b |-> TRUE] = <<3, 1, 2>>) <=> (TRUE <=> TRUE))]).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08864 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    -1
    which is not in its domain.
---*)
