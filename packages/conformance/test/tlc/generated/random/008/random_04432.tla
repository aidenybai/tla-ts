(*---
description: Evaluates a random set expression, seed 262, number 4432.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04432 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(CHOOSE f \in [{1, 2} -> {2, 1, 3}] : TRUE) : b6974 \in UNION {{0, 2147483647}, UNION {{2, 1, 3}, Nat}}} \cap {b6975 \in ((Nat \cup Nat) \cap (1..3 \cap TRUE)) : ([a |-> 3, b |-> FALSE] = [a |-> 1, b |-> TRUE])}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04432 failed.
    Attempted to compare overridden value Nat with non-overridden value:
    {1, 2, 3}
---*)
