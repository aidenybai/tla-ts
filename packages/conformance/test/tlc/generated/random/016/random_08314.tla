(*---
description: Evaluates a random set expression, seed 262, number 8314.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08314 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE b12867 \in {2147483647 : b12868 \in {x \in 1..3 : x > 1}} : (~TRUE)) - (-Head(<<1, 2>>))) .. Head([<<0, 2147483647>> EXCEPT ![1] = (2 + 0)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08314 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 92 of module random_08314
---*)
