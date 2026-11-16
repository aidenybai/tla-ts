(*---
description: Evaluates a random set expression, seed 262, number 1288.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01288 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN [b2049 \in (CHOOSE f \in [{1, 2} \ {1} -> 2..1] : TRUE) |-> IF (Nat = {x \in 1..3 : x > 1}) THEN (<<5, 6>>)[2147483647] ELSE (CHOOSE b2050 \in 1..3 : FALSE)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01288 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 35 to line 14, col 76 of module random_01288
---*)
