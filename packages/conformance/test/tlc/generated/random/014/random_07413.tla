(*---
description: Evaluates a random set expression, seed 262, number 7413.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07413 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN (CHOOSE b11422 \in UNION {(2..1 \cap {1, 2}), (1..3 \cap 2..1)} : (Append(<<>>, 0) = (CHOOSE f \in [{1, 2} \ {1} -> {0} \cup {1}] : TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07413 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 24 to line 14, col 160 of module random_07413
---*)
