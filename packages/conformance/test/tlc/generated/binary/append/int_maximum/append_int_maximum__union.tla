(*---
description: append of int_maximum, a IntValue, and union, a UnionValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_int_maximum__union ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(2147483647, UNION {{1}, {2}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    2147483647
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    2147483647
---*)
