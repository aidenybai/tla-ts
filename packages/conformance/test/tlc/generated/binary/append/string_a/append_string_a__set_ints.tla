(*---
description: append of string_a, a StringValue, and set_ints, a SetEnumValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_string_a__set_ints ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append("a", {2, 1}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    "a"
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    "a"
---*)
