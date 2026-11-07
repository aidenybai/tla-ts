(*---
description: Evaluates a random set expression, seed 262, number 6963.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06963 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b10655 \in {(7 + 0) : b10656 \in {b10657 \in {2, 1, 3} : FALSE}} : ((<<>> = (1 :> 2)) /\ (b10655 \in {1}))} \cap (CHOOSE f \in [{1, 2} -> {}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06963 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 132 to line 14, col 165 of module random_06963
---*)
