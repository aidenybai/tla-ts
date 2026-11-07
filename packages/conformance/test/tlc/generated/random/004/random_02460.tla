(*---
description: Evaluates a random int expression, seed 262, number 2460.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02460 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[a |-> ([a |-> 1]).a, b |-> (~FALSE)] EXCEPT !.a = @ + ([b3876 \in 2..1 |-> b3876] @@ (CHOOSE f \in [{0} \cup {1} -> 2..1] : TRUE))]).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02460 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 105 to line 14, col 146 of module random_02460
---*)
