(*---
description: Compares string_set, a UserValue, with int, a UserValue.
ref: tlc2/value/impl/UserValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_string_set__int ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((STRING) = (Int))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2155:0 Attempted to compare STRING with the value
    Int
    2155:0 Attempted to compare STRING with the value
    Int
---*)
