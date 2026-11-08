(*---
description: Evaluates a random set expression, seed 262, number 2871.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02871 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(Head(Tail(<<1>>)) + ((0 - [a |-> 1, b |-> TRUE]) + (TRUE + 1))), Cardinality(({-1 : b4548 \in 3} \cap UNION {{1, 2}, {x \in 1..3 : x > 1}}))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02871 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
