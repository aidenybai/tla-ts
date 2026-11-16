(*---
description: function_over applied to record_nested, a RecordValue.
ref: tlc2/value/impl/FcnLambdaValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_over_record_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([e \in [a |-> [b |-> <<1>>]] |-> e])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [e \\in [a |-> [b |-> <<1>>]] |-> <expression line 14, col 49 to line 14, col 49 of module function_over_record_nested>]"
---*)
