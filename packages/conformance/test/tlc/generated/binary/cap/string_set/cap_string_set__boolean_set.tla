(*---
description: cap of string_set, a UserValue, and boolean_set, a SetEnumValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_string_set__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((STRING) \cap (BOOLEAN))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2158:0 Attempted to check if the value:
    FALSE
    is an element of STRING.
    2158:0 Attempted to check if the value:
    FALSE
    is an element of STRING.
---*)
