(*---
description: append of int_minimum, a IntValue, and int_maximum, a IntValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_int_minimum__int_maximum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append((-2147483647 - 1), 2147483647))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module append_int_minimum__int_maximum failed.
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    -2147483648
---*)
