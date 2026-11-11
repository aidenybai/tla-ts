(*---
description: Evaluates a random int expression, seed 262, number 6018.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06018 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality({(Head(<<1, 2>>) % Len(<<3, 1, 2>>)), (-(CHOOSE f \in [{0} \cup {1} -> 2..1] : TRUE))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06018 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 69 to line 14, col 110 of module random_06018
---*)
