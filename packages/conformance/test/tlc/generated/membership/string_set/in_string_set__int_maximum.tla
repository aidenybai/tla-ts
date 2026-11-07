(*---
description: Asks whether int_maximum is in string_set, a UserValue.
ref: tlc2/value/impl/UserValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_string_set__int_maximum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((2147483647) \in (STRING))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2158:0 Attempted to check if the value:
    2147483647
    is an element of STRING.
    2158:0 Attempted to check if the value:
    2147483647
    is an element of STRING.
---*)
