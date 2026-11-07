(*---
description: Compares string_set, a UserValue, with nat, a UserValue.
ref: tlc2/value/impl/UserValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_string_set__nat ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((STRING) = (Nat))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2155:0 Attempted to compare STRING with the value
    Nat
    2155:0 Attempted to compare STRING with the value
    Nat
---*)
