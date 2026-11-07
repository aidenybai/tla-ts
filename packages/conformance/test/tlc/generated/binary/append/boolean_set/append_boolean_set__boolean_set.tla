(*---
description: append of boolean_set, a SetEnumValue, and boolean_set, a SetEnumValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_boolean_set__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(BOOLEAN, BOOLEAN))
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
