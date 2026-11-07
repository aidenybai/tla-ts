(*---
description: append of record, a RecordValue, and seq_set, a UserValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_record__seq_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append([a |-> 1, b |-> 2], Seq({1})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    [a |-> 1, b |-> 2]
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    [a |-> 1, b |-> 2]
---*)
