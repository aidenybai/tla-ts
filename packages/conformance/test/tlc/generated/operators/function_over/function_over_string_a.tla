(*---
description: function_over applied to string_a, a StringValue.
ref: tlc2/value/impl/FcnLambdaValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_over_string_a ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([e \in "a" |-> e])
====

(*--- recorded
all:
  exit: 0
  transcript: '| [e \in "a" |-> <expression line 14, col 31 to line 14, col 31 of module function_over_string_a>]'
---*)
