(*---
description: Evaluates a random bool expression, seed 262, number 2890.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02890 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~(~(({x \in 1..3 : x > 1} \ {1}) \cap (2..1 \cap {})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02890 failed.
    Attempted to apply the operator ~ to a non-boolean
    (a set of the form {e1, ... ,eN})
    line 14, col 19 to line 14, col 69 of module random_02890
---*)
