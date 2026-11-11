(*---
description: Evaluates a random set expression, seed 262, number 3564.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03564 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN (((CHOOSE f \in [{1, 2} \ {1} -> {}] : TRUE))[(0 + 0)] :> LET b5634 == ([a |-> 1, b |-> TRUE]).a IN ([a |-> 1]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03564 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 26 to line 14, col 65 of module random_03564
---*)
