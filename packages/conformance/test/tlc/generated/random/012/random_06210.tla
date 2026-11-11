(*---
description: Evaluates a random set expression, seed 262, number 6210.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06210 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {UNION {DOMAIN (CHOOSE f \in [{} -> {1, 2} \ {1}] : TRUE), {(0 + 7) : b9563 \in {2 : b9564 \in 1..3}}}, ((({1, 2} \ {}) \cap {b9565 : b9565 \in {1, 2}}) \cap (~(TRUE /\ TRUE)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06210 failed.
    Attempted to check if the value:
    1
    is an element of the boolean FALSE
---*)
