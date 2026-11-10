(*---
description: append of set_of_records, a SetOfRcdsValue, and function_empty, a FcnRcdValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_set_of_records__function_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append([a : {1, 2}], [x \in {} |-> x]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module append_set_of_records__function_empty failed.
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    {[a |-> 1], [a |-> 2]}
---*)
