(*---
description: cap of set_ints, a SetEnumValue, and string_set, a UserValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_set_ints__string_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({2, 1}) \cap (STRING))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2158:0 Attempted to check if the value:
    2
    is an element of STRING.
    2158:0 Attempted to check if the value:
    2
    is an element of STRING.
---*)
