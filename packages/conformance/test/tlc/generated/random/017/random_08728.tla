(*---
description: Evaluates a random bool expression, seed 262, number 8728.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08728 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((\A b13516 \in ({-1, 0} \cup {b13517 \in {2, 1, 3} : TRUE}) : (~(1 = b13516))) \in {Head(<<0, 1>>), (CHOOSE b13518 \in (2..1 \ {1, 2}) : (~TRUE))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08728 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 118 to line 14, col 160 of module random_08728
---*)
