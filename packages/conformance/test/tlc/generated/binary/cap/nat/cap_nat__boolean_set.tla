(*---
description: cap of nat, a UserValue, and boolean_set, a SetEnumValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_nat__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Nat) \cap (BOOLEAN))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2158:0 Attempted to check if the value:
    FALSE
    is an element of Nat.
    2158:0 Attempted to check if the value:
    FALSE
    is an element of Nat.
---*)
