(*---
description: Asks whether record_nested is in seq_set, a UserValue.
ref: tlc2/value/impl/UserValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_seq_set__record_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> [b |-> <<1>>]]) \in (Seq({1})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2158:0 Attempted to check if the value:
    [a |-> [b |-> <<1>>]]
    is an element of Seq({1}).
    2158:0 Attempted to check if the value:
    [a |-> [b |-> <<1>>]]
    is an element of Seq({1}).
---*)
