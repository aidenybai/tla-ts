(*---
description: Evaluates a random bool expression, seed 262, number 2955.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02955 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b4680 \in {Cardinality(({1, 2} \ {})), (CHOOSE b4681 \in ({2, 1, 3} \ 2..1) : (1..3 \subseteq {1}))} : (((2 + -1) \in (2147483647 .. 2147483647)) /\ ((1..3 = 1..3) \/ (\E b4682 \in {2, 1, 3} : FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02955 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 60 to line 14, col 117 of module random_02955
---*)
