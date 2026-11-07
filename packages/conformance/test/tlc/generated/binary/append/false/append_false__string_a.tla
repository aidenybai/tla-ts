(*---
description: append of false, a BoolValue, and string_a, a StringValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_false__string_a ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(FALSE, "a"))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    FALSE
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    FALSE
---*)
