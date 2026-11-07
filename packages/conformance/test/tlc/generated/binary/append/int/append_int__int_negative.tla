(*---
description: append of int, a UserValue, and int_negative, a IntValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_int__int_negative ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(Int, -3))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    Int
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    Int
---*)
