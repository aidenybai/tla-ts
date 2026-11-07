(*---
description: Asks whether int is in nat, a UserValue.
ref: tlc2/value/impl/UserValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_nat__int ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Int) \in (Nat))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2158:0 Attempted to check if the value:
    Int
    is an element of Nat.
    2158:0 Attempted to check if the value:
    Int
    is an element of Nat.
---*)
