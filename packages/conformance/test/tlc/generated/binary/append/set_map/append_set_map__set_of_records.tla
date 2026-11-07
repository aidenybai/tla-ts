(*---
description: append of set_map, a SetEnumValue, and set_of_records, a SetOfRcdsValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_set_map__set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append({x + 1 : x \in 1..2}, [a : {1, 2}]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    {2, 3}
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    {2, 3}
---*)
