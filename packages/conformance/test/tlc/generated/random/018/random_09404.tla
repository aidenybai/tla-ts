(*---
description: Evaluates a random bool expression, seed 262, number 9404.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09404 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE r \in [a : {}] : TRUE) /\ (((\A b14589 \in {x \in 1..3 : x > 1} : TRUE) => (TRUE <=> TRUE)) /\ (SelectSeq(<<>>, LAMBDA e : e > 0) = (CHOOSE f \in [{1, 2} \cap {2} -> {1, 2} \cap {2}] : TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09404 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 45 of module random_09404
---*)
