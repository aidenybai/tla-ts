(*---
description: Evaluates a random set expression, seed 262, number 1268.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01268 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b2024 \in DOMAIN (CHOOSE f \in [{2, 1, 3} -> 2..1] : TRUE) : ((<<<<5, 6>>, -1>> = [b2025 \in 1..3 |-> b2024]) /\ (\A b2026 \in {{2, 1, 3}, b2024} : (7 \in SUBSET {1})))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01268 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 35 to line 14, col 73 of module random_01268
---*)
