(*---
description: Asks whether nat is in nat, a UserValue.
ref: tlc2/value/impl/UserValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_nat__nat ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Nat) \in (Nat))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module in_nat__nat failed.
    2158:0 Attempted to check if the value:
    Nat
    is an element of Nat.
---*)
