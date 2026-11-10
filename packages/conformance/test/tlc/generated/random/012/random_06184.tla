(*---
description: Evaluates a random set expression, seed 262, number 6184.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06184 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b9517 \in DOMAIN (CHOOSE f \in [{1, 2} \ {1} -> {}] : TRUE) : (((b9517 + b9517) .. ([x \in Nat |-> x + 1])[TRUE]) \subseteq {(b9517 % b9518) : b9518 \in DOMAIN (1 :> 2)})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06184 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 35 to line 14, col 74 of module random_06184
---*)
