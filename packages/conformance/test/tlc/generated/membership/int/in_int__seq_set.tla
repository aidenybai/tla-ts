(*---
description: Asks whether seq_set is in int, a UserValue.
ref: tlc2/value/impl/UserValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_int__seq_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Seq({1})) \in (Int))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2158:0 Attempted to check if the value:
    Seq({1})
    is an element of Int.
    2158:0 Attempted to check if the value:
    Seq({1})
    is an element of Int.
---*)
