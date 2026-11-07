(*---
description: Compares string_set, a UserValue, with seq_set, a UserValue.
ref: tlc2/value/impl/UserValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_string_set__seq_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((STRING) = (Seq({1})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2155:0 Attempted to compare STRING with the value
    Seq({1})
    2155:0 Attempted to compare STRING with the value
    Seq({1})
---*)
