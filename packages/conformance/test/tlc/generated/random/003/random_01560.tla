(*---
description: Evaluates a random set expression, seed 262, number 1560.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01560 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {UNION {DOMAIN [b2491 \in 2..1 |-> 1], {(2 - TRUE) : b2492 \in UNION {{1, 2}, SUBSET {1}}}}, DOMAIN ((2 :> 3) @@ ([x \in Nat |-> x + 1] @@ [x \in 1..2 |-> x]))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01560 failed.
    Attempted to compare the set {} with the value:
    1
---*)
