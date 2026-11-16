(*---
description: Evaluates a random int expression, seed 262, number 4198.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04198 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality((([<<5, 6>> EXCEPT !.a = 0]).a .. ([a |-> 0, b |-> FALSE]).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04198 failed.
    Attempted to access tuple at a non integral index: "a"
---*)
