(*---
description: Evaluates a random int expression, seed 262, number 7012.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07012 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality((IF (~TRUE) THEN ([a |-> 1]).a ELSE (-0) .. ([b10749 \in 2..1 |-> b10749])[LET b10750 == -1 IN b10750])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07012 failed.
    In applying the function
    <<>>,
    the first argument is:
    -1
    which is not in its domain.
---*)
