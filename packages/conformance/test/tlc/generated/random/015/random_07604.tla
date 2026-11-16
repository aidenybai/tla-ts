(*---
description: Evaluates a random set expression, seed 262, number 7604.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07604 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN (Head(Append(<<>>, 3)) :> ([<<5, 6>> EXCEPT ![2] = -1])[(1..3 \cap {1, 2})]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07604 failed.
    Attempted to access tuple at a non integral index: {1, 2}
---*)
