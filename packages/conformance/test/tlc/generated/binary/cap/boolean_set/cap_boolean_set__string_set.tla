(*---
description: cap of boolean_set, a SetEnumValue, and string_set, a UserValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_boolean_set__string_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((BOOLEAN) \cap (STRING))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module cap_boolean_set__string_set failed.
    2158:0 Attempted to check if the value:
    FALSE
    is an element of STRING.
---*)
