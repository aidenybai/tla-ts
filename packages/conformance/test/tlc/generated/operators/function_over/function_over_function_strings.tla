(*---
description: function_over applied to function_strings, a FcnRcdValue.
ref: tlc2/value/impl/FcnLambdaValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_over_function_strings ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([e \in [x \in {"a", "b"} |-> x] |-> e])
====

(*--- recorded
all:
  exit: 0
  transcript: '| [e \in [a |-> "a", b |-> "b"] |-> <expression line 14, col 52 to line 14, col 52 of module function_over_function_strings>]'
---*)
