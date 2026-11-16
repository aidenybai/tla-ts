(*---
description: Asks whether function_lazy is in nat, a UserValue.
ref: tlc2/value/impl/UserValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_nat__function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in Nat |-> x]) \in (Nat))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module in_nat__function_lazy failed.
    2158:0 Attempted to check if the value:
    [x \in Nat |-> <expression line 14, col 32 to line 14, col 32 of module in_nat__function_lazy>]
    is an element of Nat.
---*)
