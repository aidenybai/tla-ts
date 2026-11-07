(*---
description: Compares int, a UserValue, with string_set, a UserValue.
ref: tlc2/value/impl/UserValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_int__string_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Int) = (STRING))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2155:0 Attempted to compare Int with the value
    STRING
    2155:0 Attempted to compare Int with the value
    STRING
---*)
