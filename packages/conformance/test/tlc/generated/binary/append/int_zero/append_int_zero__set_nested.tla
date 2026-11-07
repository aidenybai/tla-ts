(*---
description: append of int_zero, a IntValue, and set_nested, a SetEnumValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_int_zero__set_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(0, {{1}, {}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    0
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    0
---*)
