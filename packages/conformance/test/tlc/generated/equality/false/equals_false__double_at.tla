(*---
description: Compares false, a BoolValue, with double_at, a FcnRcdValue.
ref: tlc2/value/impl/BoolValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_false__double_at ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((FALSE) = ((1 :> 2) @@ (2 :> 3)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_false__double_at failed.
    Attempted to compare equality of boolean FALSE with non-boolean:
    <<2, 3>>
---*)
