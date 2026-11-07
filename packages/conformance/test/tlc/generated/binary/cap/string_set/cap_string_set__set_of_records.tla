(*---
description: cap of string_set, a UserValue, and set_of_records, a SetOfRcdsValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_string_set__set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((STRING) \cap ([a : {1, 2}]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2158:0 Attempted to check if the value:
    [a |-> 1]
    is an element of STRING.
    2158:0 Attempted to check if the value:
    [a |-> 1]
    is an element of STRING.
---*)
