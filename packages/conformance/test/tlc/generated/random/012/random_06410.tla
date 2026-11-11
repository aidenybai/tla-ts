(*---
description: Evaluates a random bool expression, seed 262, number 6410.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06410 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((~(UNION {{}, SUBSET {1}} = {0, 3})) /\ (((1).a = (-3)) /\ [a |-> (-1 % TRUE), b |-> (TRUE <=> FALSE)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06410 failed.
    Attempted to check equality of the set {} with the value:
    0
---*)
