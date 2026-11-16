(*---
description: Evaluates a random bool expression, seed 262, number 8058.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08058 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE r \in [a : 2..1] : TRUE) = (CHOOSE b12447 \in (({1} \cup {1, 2}) \cap {b12448 \in {} : {2, 1, 3}}) : ((b12447 + 3) = (b12447 * b12447)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08058 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 47 of module random_08058
---*)
