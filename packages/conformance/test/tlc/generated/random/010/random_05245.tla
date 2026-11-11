(*---
description: Evaluates a random bool expression, seed 262, number 5245.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05245 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b8120 \in ((UNION {SUBSET {1}, Nat} \ {b8121 : b8121 \in SUBSET {1}}) \ UNION {UNION {{1, 2}, 7}, DOMAIN [a |-> 1, b |-> TRUE]}) : (((-1 - b8120) < (b8120 + b8120)) => ((\A b8122 \in 2..1 : FALSE) <=> ({x \in 1..3 : x > 1} = {})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05245 failed.
    Attempted to compare overridden value Nat with non-overridden value:
    {{}, {1}}
---*)
