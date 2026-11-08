(*---
description: append of int_maximum, a IntValue, and set_ints, a SetEnumValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_int_maximum__set_ints ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(2147483647, {2, 1}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module append_int_maximum__set_ints failed.
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    2147483647
---*)
