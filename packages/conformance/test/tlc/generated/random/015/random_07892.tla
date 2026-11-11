(*---
description: Evaluates a random set expression, seed 262, number 7892.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07892 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(Cardinality({}) - IF TRUE THEN 7 ELSE [a |-> 1]) : b12182 \in DOMAIN (7 :> 3)} \ DOMAIN (CHOOSE f \in [{2, 1, 3} -> {}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07892 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 108 to line 14, col 144 of module random_07892
---*)
