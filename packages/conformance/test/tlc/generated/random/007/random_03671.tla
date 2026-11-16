(*---
description: Evaluates a random bool expression, seed 262, number 3671.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03671 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~((\A b5801 \in {b5802 : b5802 \in 2..1} : (2..1 = {})) /\ ({FALSE, 2147483647} => (TRUE <=> TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03671 failed.
    Attempted to evaluate an expression of form P => Q when P was
    a set of the form {e1, ... ,eN}.
    line 14, col 77 to line 14, col 114 of module random_03671
---*)
