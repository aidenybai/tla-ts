(*---
description: Evaluates a random function expression, seed 262, number 1334.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01334 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [{1, 2} -> 2..1] : TRUE) @@ {((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)).a, ((CHOOSE f \in [1..2 -> {}] : TRUE))[Len(<<>>)]}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01334 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 53 of module random_01334
---*)
