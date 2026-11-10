(*---
description: Evaluates a random bool expression, seed 262, number 8229.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08229 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN (CHOOSE f \in [{2, 1, 3} -> 2..1] : TRUE) = {Append([<<>> EXCEPT ![1] = 2], CASE TRUE -> b12736 [] OTHER -> b12736) : b12736 \in Cardinality({b12737 : b12737 \in {2, 1, 3}})}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08229 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 25 to line 14, col 63 of module random_08229
---*)
