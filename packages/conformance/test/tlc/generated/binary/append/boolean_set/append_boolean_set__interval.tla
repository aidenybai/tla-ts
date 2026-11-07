(*---
description: append of boolean_set, a SetEnumValue, and interval, a IntervalValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_boolean_set__interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(BOOLEAN, 1..3))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    {FALSE, TRUE}
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    {FALSE, TRUE}
---*)
