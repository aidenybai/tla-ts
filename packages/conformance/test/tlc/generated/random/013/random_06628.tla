(*---
description: Evaluates a random set expression, seed 262, number 6628.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06628 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((({0 : b10178 \in 2..1} \cup UNION {{2, 1, 3}, SUBSET {1}}) \cup (({x \in 1..3 : x > 1} \cup SUBSET {1}) \cap {b10179 \in {2, 1, 3} : TRUE})) \ DOMAIN [b10180 \in (Nat \cap 2..1) |-> (-0)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06628 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
