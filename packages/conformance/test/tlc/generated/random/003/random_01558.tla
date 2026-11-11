(*---
description: Evaluates a random seq expression, seed 262, number 1558.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01558 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(<<LET b2487 == Cardinality({1}) IN ({1}).a, ([b2488 \in 2..1 |-> b2488])[(-7)]>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01558 failed.
    Attempted to select field "a" from a non-record value {1}
    line 14, col 56 to line 14, col 62 of module random_01558
---*)
