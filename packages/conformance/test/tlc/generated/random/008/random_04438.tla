(*---
description: Evaluates a random int expression, seed 262, number 4438.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04438 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality(((CHOOSE f \in [{1, 2} \ {1} -> {}] : TRUE) \cup {b6988 \in [b6989 \in {} |-> b6989] : (2147483647 < b6988)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04438 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 30 to line 14, col 69 of module random_04438
---*)
