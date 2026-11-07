(*---
description: Asks whether cross is in string_set, a UserValue.
ref: tlc2/value/impl/UserValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_string_set__cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \X {3}) \in (STRING))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2158:0 Attempted to check if the value:
    {<<1, 3>>, <<2, 3>>}
    is an element of STRING.
    2158:0 Attempted to check if the value:
    {<<1, 3>>, <<2, 3>>}
    is an element of STRING.
---*)
