(*---
description: Compares seq_set, a UserValue, with nat, a UserValue.
ref: tlc2/value/impl/UserValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_seq_set__nat ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Seq({1})) = (Nat))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2155:0 Attempted to compare Seq({1}) with the value
    Nat
    2155:0 Attempted to compare Seq({1}) with the value
    Nat
---*)
