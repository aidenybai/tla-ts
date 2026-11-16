(*---
description: function_over applied to seq_set, a UserValue.
ref: tlc2/value/impl/FcnLambdaValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_over_seq_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([e \in Seq({1}) |-> e])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [e \\in Seq({1}) |-> <expression line 14, col 36 to line 14, col 36 of module function_over_seq_set>]"
---*)
