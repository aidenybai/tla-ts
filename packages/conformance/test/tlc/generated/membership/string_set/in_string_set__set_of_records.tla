(*---
description: Asks whether set_of_records is in string_set, a UserValue.
ref: tlc2/value/impl/UserValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_string_set__set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a : {1, 2}]) \in (STRING))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2158:0 Attempted to check if the value:
    {[a |-> 1], [a |-> 2]}
    is an element of STRING.
    2158:0 Attempted to check if the value:
    {[a |-> 1], [a |-> 2]}
    is an element of STRING.
---*)
