(*---
description: append of record_nested, a RecordValue, and set_mixed, a SetEnumValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_record_nested__set_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append([a |-> [b |-> <<1>>]], {1, "a"}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    [a |-> [b |-> <<1>>]]
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    [a |-> [b |-> <<1>>]]
---*)
