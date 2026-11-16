(*---
description: Evaluates a random bool expression, seed 262, number 6711.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06711 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [{1, 2} -> {}] : TRUE) \in {(Len(<<1, 2>>) * ([a |-> 1, b |-> TRUE]).a) : b10287 \in (([a |-> 1, b |-> TRUE]).a .. Cardinality(Nat))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06711 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 51 of module random_06711
---*)
