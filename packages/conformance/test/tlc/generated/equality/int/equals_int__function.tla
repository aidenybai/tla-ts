(*---
description: Compares int, a UserValue, with function, a FcnRcdValue.
ref: tlc2/value/impl/UserValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_int__function ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Int) = ([x \in {1, 2} |-> x * 2]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_int__function failed.
    Attempted to compare overridden value Int with non-overridden value:
    <<2, 4>>
---*)
