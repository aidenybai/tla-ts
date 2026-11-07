(*---
description: append of int_negative, a IntValue, and interval_empty, a IntervalValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_int_negative__interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(-3, 3..1))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    -3
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    -3
---*)
