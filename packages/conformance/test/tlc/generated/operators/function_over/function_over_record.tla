(*---
description: function_over applied to record, a RecordValue.
ref: tlc2/value/impl/FcnLambdaValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_over_record ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([e \in [a |-> 1, b |-> 2] |-> e])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [e \\in [a |-> 1, b |-> 2] |-> <expression line 14, col 46 to line 14, col 46 of module function_over_record>]"
---*)
