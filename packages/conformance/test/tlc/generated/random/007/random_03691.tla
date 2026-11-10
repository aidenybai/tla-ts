(*---
description: Evaluates a random bool expression, seed 262, number 3691.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03691 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b5831 \in DOMAIN (CHOOSE f \in [{1, 2} \cap {2} -> {1}] : TRUE) : ([(-b5831) EXCEPT !.a = (<<5, 6>>)[2147483647]] = [[[a |-> 1] EXCEPT !.a = @ + b5831] EXCEPT !.a = (b5831 * Nat)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03691 failed.
    Attempted to apply EXCEPT construct to the value -2.
---*)
