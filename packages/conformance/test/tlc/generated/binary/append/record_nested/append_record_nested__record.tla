(*---
description: append of record_nested, a RecordValue, and record, a RecordValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_record_nested__record ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append([a |-> [b |-> <<1>>]], [a |-> 1, b |-> 2]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module append_record_nested__record failed.
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    [a |-> [b |-> <<1>>]]
---*)
