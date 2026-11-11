(*---
description: Evaluates a random int expression, seed 262, number 9919.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09919 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [{0} \cup {1} -> {0} \cup {1}] : TRUE))[(CHOOSE b15429 \in (({1, 2} \ Nat) \cap (Nat \cup Nat)) : ((\E b15430 \in 2..1 : TRUE) \/ (TRUE \/ FALSE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09919 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 72 to line 14, col 176 of module random_09919
---*)
