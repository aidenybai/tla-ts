(*---
description: append of nat, a UserValue, and set_filter, a SetPredValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_nat__set_filter ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(Nat, {x \in 1..3 : x > 1}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module append_nat__set_filter failed.
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    Nat
---*)
