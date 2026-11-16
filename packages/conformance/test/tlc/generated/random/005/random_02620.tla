(*---
description: Evaluates a random set expression, seed 262, number 2620.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02620 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN (([a |-> -1, b |-> FALSE]).a :> (\A b4126 \in {b4127 : b4127 \in 1..3} : (Nat = {}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02620 failed.
    Attempted to compare overridden value Nat with non-overridden value:
    {}
---*)
