(*---
description: cap of boolean_set, a SetEnumValue, and nat, a UserValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_boolean_set__nat ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((BOOLEAN) \cap (Nat))
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
