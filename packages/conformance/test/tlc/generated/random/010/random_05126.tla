(*---
description: Evaluates a random bool expression, seed 262, number 5126.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05126 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b7970 \in DOMAIN [b7971 \in (SUBSET {1} \ {x \in 1..3 : x > 1}) |-> (b7971 + b7971)] : ({b7972 \in {1, b7970} : (FALSE \/ TRUE)} \subseteq ({b7970, 1} \ ([a |-> 1, b |-> TRUE] \cap {2, 1, 3})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05126 failed.
    Attempted to compare the set {} with the value:
    3
---*)
