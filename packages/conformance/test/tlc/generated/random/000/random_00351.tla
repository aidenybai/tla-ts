(*---
description: Evaluates a random set expression, seed 262, number 351.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00351 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN (CHOOSE f \in [{0} \cup {1} -> {}] : TRUE))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00351 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 24 to line 14, col 63 of module random_00351
---*)
