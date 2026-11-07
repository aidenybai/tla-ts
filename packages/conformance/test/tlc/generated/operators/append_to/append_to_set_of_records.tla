(*---
description: append_to applied to set_of_records, a SetOfRcdsValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_to_set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append([a : {1, 2}], 9))
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
