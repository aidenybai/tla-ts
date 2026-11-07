(*---
description: Compares seq_set, a UserValue, with string_set, a UserValue.
ref: tlc2/value/impl/UserValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_seq_set__string_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Seq({1})) = (STRING))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2155:0 Attempted to compare Seq({1}) with the value
    STRING
    2155:0 Attempted to compare Seq({1}) with the value
    STRING
---*)
