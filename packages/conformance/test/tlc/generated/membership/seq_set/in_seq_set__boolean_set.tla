(*---
description: Asks whether boolean_set is in seq_set, a UserValue.
ref: tlc2/value/impl/UserValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_seq_set__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((BOOLEAN) \in (Seq({1})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module in_seq_set__boolean_set failed.
    2158:0 Attempted to check if the value:
    {FALSE, TRUE}
    is an element of Seq({1}).
---*)
