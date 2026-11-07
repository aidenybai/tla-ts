(*---
description: append of boolean_set, a SetEnumValue, and set_filter, a SetPredValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_boolean_set__set_filter ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(BOOLEAN, {x \in 1..3 : x > 1}))
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
