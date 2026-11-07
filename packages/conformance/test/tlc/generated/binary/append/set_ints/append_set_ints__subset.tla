(*---
description: append of set_ints, a SetEnumValue, and subset, a SubsetValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_set_ints__subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append({2, 1}, SUBSET {1, 2}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    {1, 2}
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    {1, 2}
---*)
