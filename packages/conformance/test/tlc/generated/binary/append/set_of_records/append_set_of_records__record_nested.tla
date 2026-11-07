(*---
description: append of set_of_records, a SetOfRcdsValue, and record_nested, a RecordValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_set_of_records__record_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append([a : {1, 2}], [a |-> [b |-> <<1>>]]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    {[a |-> 1], [a |-> 2]}
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    {[a |-> 1], [a |-> 2]}
---*)
