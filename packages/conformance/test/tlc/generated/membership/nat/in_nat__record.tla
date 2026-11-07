(*---
description: Asks whether record is in nat, a UserValue.
ref: tlc2/value/impl/UserValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_nat__record ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> 1, b |-> 2]) \in (Nat))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2158:0 Attempted to check if the value:
    [a |-> 1, b |-> 2]
    is an element of Nat.
    2158:0 Attempted to check if the value:
    [a |-> 1, b |-> 2]
    is an element of Nat.
---*)
