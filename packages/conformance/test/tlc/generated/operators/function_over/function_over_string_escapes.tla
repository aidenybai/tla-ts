(*---
description: function_over applied to string_escapes, a StringValue.
ref: tlc2/value/impl/FcnLambdaValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_over_string_escapes ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([e \in "a\"b\\c\n" |-> e])
====

(*--- recorded
all:
  exit: 0
  transcript: '| [e \in "a\"b\\c\n" |-> <expression line 14, col 39 to line 14, col 39 of module function_over_string_escapes>]'
---*)
