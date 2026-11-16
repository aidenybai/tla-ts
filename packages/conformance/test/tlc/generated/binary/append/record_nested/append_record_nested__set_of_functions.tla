(*---
description: append of record_nested, a RecordValue, and set_of_functions, a SetOfFcnsValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_record_nested__set_of_functions ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append([a |-> [b |-> <<1>>]], [{1} -> {2, 3}]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module append_record_nested__set_of_functions failed.
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    [a |-> [b |-> <<1>>]]
---*)
