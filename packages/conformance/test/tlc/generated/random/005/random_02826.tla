(*---
description: Evaluates a random int expression, seed 262, number 2826.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02826 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> [b4495 \in ({} \cup {2, 1, 3}) |-> Len(1..3)], b |-> (({1} \ FALSE) = (2..1 \ {x \in 1..3 : x > 1}))]).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02826 failed.
    2283:0 The argument of Len should be a sequence, but instead it is:
    1..3
---*)
