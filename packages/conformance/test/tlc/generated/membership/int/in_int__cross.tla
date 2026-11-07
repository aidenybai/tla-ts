(*---
description: Asks whether cross is in int, a UserValue.
ref: tlc2/value/impl/UserValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_int__cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \X {3}) \in (Int))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2158:0 Attempted to check if the value:
    {<<1, 3>>, <<2, 3>>}
    is an element of Int.
    2158:0 Attempted to check if the value:
    {<<1, 3>>, <<2, 3>>}
    is an element of Int.
---*)
