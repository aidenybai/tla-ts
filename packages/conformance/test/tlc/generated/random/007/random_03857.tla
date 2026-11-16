(*---
description: Evaluates a random function expression, seed 262, number 3857.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03857 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b6077 \in DOMAIN (CHOOSE f \in [{1, 2} \ {1} -> {1, 2} \ {1}] : TRUE) |-> ((([x \in Nat |-> x + 1])[b6077] * (b6077 + b6077)) * Len({0, 3}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03857 failed.
    2283:0 The argument of Len should be a sequence, but instead it is:
    {0, 3}
---*)
