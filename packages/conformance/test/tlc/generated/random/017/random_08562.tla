(*---
description: Evaluates a random bool expression, seed 262, number 8562.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08562 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~((\E b13266 \in ({1} \cap 1..3) : UNION {{}, {}}) \/ (\A b13267 \in {0, 7} : ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE])))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08562 failed.
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 20 to line 14, col 65 of module random_08562
---*)
