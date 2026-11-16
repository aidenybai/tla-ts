(*---
description: Evaluates a random bool expression, seed 262, number 9120.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09120 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> LET b14166 == (2 - 0) IN (b14166 * 3), b |-> (Cardinality(1..3) < Head(<<1, 2>>))] <=> (((7 * 7) = (1 + 2)) => ((7 \in 2..1) <=> (-1 \in {})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09120 failed.
    Attempted to evaluate an expression of form P <=> Q when P or Q was not a boolean.
    line 14, col 17 to line 14, col 165 of module random_09120
---*)
