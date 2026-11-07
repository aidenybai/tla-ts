(*---
description: cap of nat, a UserValue, and set_of_functions, a SetOfFcnsValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_nat__set_of_functions ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Nat) \cap ([{1} -> {2, 3}]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2158:0 Attempted to check if the value:
    <<2>>
    is an element of Nat.
    2158:0 Attempted to check if the value:
    <<2>>
    is an element of Nat.
---*)
