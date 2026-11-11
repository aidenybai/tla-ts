(*---
description: Asks whether function_empty is in nat, a UserValue.
ref: tlc2/value/impl/UserValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_nat__function_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {} |-> x]) \in (Nat))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module in_nat__function_empty failed.
    2158:0 Attempted to check if the value:
    <<>>
    is an element of Nat.
---*)
