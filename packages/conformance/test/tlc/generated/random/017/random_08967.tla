(*---
description: Evaluates a random bool expression, seed 262, number 8967.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08967 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b13906 \in {(CHOOSE b13907 \in ({} \cap {x \in 1..3 : x > 1}) : (\E b13908 \in {2, 1, 3} : TRUE)), Cardinality(({x \in 1..3 : x > 1} \ 2..1))} : (((CHOOSE f \in [{0} \cup {1} -> {1, 2} \cap {2}] : TRUE) \subseteq (b13906 - b13906)) <=> ((2 .. 1) = (2..1 \ 1..3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08967 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 37 to line 14, col 119 of module random_08967
---*)
