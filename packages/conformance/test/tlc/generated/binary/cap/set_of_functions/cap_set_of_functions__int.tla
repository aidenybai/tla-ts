(*---
description: cap of set_of_functions, a SetOfFcnsValue, and int, a UserValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_set_of_functions__int ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([{1} -> {2, 3}]) \cap (Int))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2158:0 Attempted to check if the value:
    <<2>>
    is an element of Int.
    2158:0 Attempted to check if the value:
    <<2>>
    is an element of Int.
---*)
