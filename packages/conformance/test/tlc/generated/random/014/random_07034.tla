(*---
description: Evaluates a random bool expression, seed 262, number 7034.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07034 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((-0) * (<<5, 6>>)[1]) % (-([a |-> 1, b |-> TRUE]).a)) \in (([[a |-> 1, b |-> TRUE] EXCEPT !.a = 7]).a * ((0 * 0) * ([a |-> 1, b |-> TRUE]).a))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07034 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)
