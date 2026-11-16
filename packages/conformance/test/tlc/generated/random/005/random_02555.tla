(*---
description: Evaluates a random seq expression, seed 262, number 2555.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02555 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail([a |-> ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 7]).a, b |-> (({2, 1, 3} \ {1, 2}) \subseteq {7, 2})]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02555 failed.
    2283:0 The argument of Tail should be a sequence, but instead it is:
    [a |-> 7, b |-> FALSE]
---*)
