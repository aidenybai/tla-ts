(*---
description: Evaluates a random int expression, seed 262, number 5354.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05354 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> Cardinality(UNION {1..3, {}}), b |-> (\A b8276 \in (2..1 \cup [a |-> 1, b |-> TRUE]) : (\A b8277 \in {1} : FALSE))]).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05354 failed.
    TLC encountered a non-enumerable quantifier bound
    [a |-> 1, b |-> TRUE].
    line 14, col 76 to line 14, col 106 of module random_05354
---*)
