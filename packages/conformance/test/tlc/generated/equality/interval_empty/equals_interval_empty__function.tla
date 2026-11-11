(*---
description: Compares interval_empty, a IntervalValue, with function, a FcnRcdValue.
ref: tlc2/value/impl/IntervalValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_interval_empty__function ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((3..1) = ([x \in {1, 2} |-> x * 2]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_interval_empty__function failed.
    Attempted to check equality of the set {} with the value:
    <<2, 4>>
---*)
