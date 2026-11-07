(*---
description: diff of set_of_functions, a SetOfFcnsValue, and nat, a UserValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_set_of_functions__nat ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([{1} -> {2, 3}]) \ (Nat))
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
