(*---
description: Evaluates a random bool expression, seed 262, number 4683.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04683 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b7318 \in UNION {{(b7319 + b7319) : b7319 \in {b7320 \in {1, 2} : TRUE}}, DOMAIN (CHOOSE f \in [1..2 -> {}] : TRUE)} : (\A b7321 \in (([x \in 1..2 |-> x])[-1] .. (CHOOSE b7322 \in FALSE : FALSE)) : ((2..1 /\ TRUE) <=> (2..1 = {x \in 1..3 : x > 1})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04683 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 102 to line 14, col 133 of module random_04683
---*)
