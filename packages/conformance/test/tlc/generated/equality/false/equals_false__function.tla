(*---
description: Compares false, a BoolValue, with function, a FcnRcdValue.
ref: tlc2/value/impl/BoolValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_false__function ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((FALSE) = ([x \in {1, 2} |-> x * 2]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_false__function failed.
    Attempted to compare equality of boolean FALSE with non-boolean:
    <<2, 4>>
---*)
