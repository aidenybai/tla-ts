(*---
description: Compares seq_set, a UserValue, with double_at, a FcnRcdValue.
ref: tlc2/value/impl/UserValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_seq_set__double_at ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Seq({1})) = ((1 :> 2) @@ (2 :> 3)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_seq_set__double_at failed.
    Attempted to compare overridden value Seq({1}) with non-overridden value:
    <<2, 3>>
---*)
